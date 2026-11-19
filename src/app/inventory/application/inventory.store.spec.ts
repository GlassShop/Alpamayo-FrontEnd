import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {InventoryStore, NewItem} from './inventory.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const SITES = url(environment.sitesEndpointPath);
const ITEMS = url(environment.inventoryItemsEndpointPath);
const LEVELS = url(environment.stockLevelsEndpointPath);
const MOVEMENTS = url(environment.stockMovementsEndpointPath);

const sites = [{id: 1, name: 'Principal', address: 'Jr. Lucar y Torre N° 414'}, {id: 2, name: 'Almacén Los Libertadores'}];
const items = [
  {id: 1, glassTypeId: 5, color: '', widthCm: 330, heightCm: 214, minStock: 10},
  {id: 2, productId: 40, color: 'Negro', sku: '0017'},
];
const levels = [
  {id: 1, itemId: 1, siteId: 1, quantity: 32},
  {id: 2, itemId: 1, siteId: 2, quantity: 8},
  {id: 3, itemId: 2, siteId: 1, quantity: 0, inTransit: true, notes: 'Pedido a Lima'},
];

const movementResponse = (itemId: number, siteId: number, quantity: number, levelId: number, delta = 0) => ({
  movement: {id: 99, itemId, siteId, kind: 'COUNT', delta, quantityAfter: quantity, at: '2026-11-19T10:00:00Z', by: {id: 2, fullName: 'Vendedora'}},
  level: {id: levelId, itemId, siteId, quantity},
});

describe('InventoryStore', () => {
  let store: InventoryStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(InventoryStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadInventory(): void {
    store.load();
    http.expectOne(SITES).flush(sites);
    http.expectOne(ITEMS).flush(items);
    http.expectOne(LEVELS).flush(levels);
  }

  it('loads sites, items and stock levels, filling missing optional fields', () => {
    loadInventory();
    expect(store.sites()[1].address).toBe('');
    expect(store.item(2)).toMatchObject({glassTypeId: null, productId: 40, widthCm: null, packKind: null, minStock: null});
    expect(store.levelFor(1, 1)).toMatchObject({inTransit: false, notes: ''});
  });

  it('gives the quantity per site, the total and the status', () => {
    loadInventory();
    expect(store.quantityAt(1, 1)).toBe(32);
    expect(store.quantityAt(2, 2)).toBeNull();
    expect(store.totalQuantity(1)).toBe(40);
    expect(store.totalQuantity(99)).toBeNull();
    expect(store.statusAt(1, 2)).toBe('LOW');
    expect(store.statusAt(1, 1)).toBe('IN_STOCK');
    expect(store.statusAt(2, 1)).toBe('OUT');
    expect(store.statusAt(2, 2)).toBe('UNKNOWN');
  });

  it('records a count and updates the stock with the level the server returns', () => {
    loadInventory();
    store.count(1, 2, 12, ' Conteo de fin de mes ');
    const req = http.expectOne(MOVEMENTS);
    expect(req.request.body).toEqual({itemId: 1, siteId: 2, kind: 'COUNT', quantity: 12, reason: 'Conteo de fin de mes'});
    req.flush(movementResponse(1, 2, 12, 2, 4));
    expect(store.quantityAt(1, 2)).toBe(12);
    expect(store.movementsRecorded()).toBe(1);
  });

  it('records an adjustment and creates the level of a site that was never counted', () => {
    loadInventory();
    store.adjust(2, 2, 5);
    const req = http.expectOne(MOVEMENTS);
    expect(req.request.body).toEqual({itemId: 2, siteId: 2, kind: 'ADJUSTMENT', quantity: 5});
    req.flush(movementResponse(2, 2, 5, 4, 5));
    expect(store.quantityAt(2, 2)).toBe(5);
  });

  it('rejects counts and adjustments that would leave wrong stock', () => {
    loadInventory();
    store.count(1, 1, -1);
    expect(store.error()).toBe('inventory.error.invalid-quantity');
    store.count(1, 1, 2.5);
    store.adjust(1, 2, -9);
    expect(store.error()).toBe('inventory.error.invalid-adjustment');
    store.adjust(1, 2, 0);
    http.expectNone(MOVEMENTS);
  });

  it('marks "en camino" on an existing level and on a site never counted', () => {
    loadInventory();
    store.setInTransit(2, 1, false);
    const update = http.expectOne(`${LEVELS}/3`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({inTransit: false});
    update.flush({...levels[2], inTransit: false});
    expect(store.levelFor(2, 1)?.inTransit).toBe(false);

    store.setInTransit(2, 2, true);
    const create = http.expectOne(LEVELS);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({itemId: 2, siteId: 2, inTransit: true});
    create.flush({id: 5, itemId: 2, siteId: 2, quantity: null, inTransit: true});
    expect(store.levelFor(2, 2)).toMatchObject({quantity: null, inTransit: true});
    expect(store.statusAt(2, 2)).toBe('UNKNOWN');
  });

  it('records the movement first and then the flags on the level it created, never both at once', () => {
    loadInventory();
    store.recordStock(2, 2, {movement: {kind: 'COUNT', quantity: 6}, reason: 'Conteo', inTransit: true, notes: ' Llega lunes '});
    const movement = http.expectOne(MOVEMENTS);
    http.expectNone(LEVELS);
    movement.flush(movementResponse(2, 2, 6, 9));
    const flags = http.expectOne(`${LEVELS}/9`);
    expect(flags.request.method).toBe('PATCH');
    expect(flags.request.body).toEqual({inTransit: true, notes: 'Llega lunes'});
    flags.flush({id: 9, itemId: 2, siteId: 2, quantity: 6, inTransit: true, notes: 'Llega lunes'});
    expect(store.levelFor(2, 2)).toMatchObject({quantity: 6, inTransit: true, notes: 'Llega lunes'});
    expect(store.movementsRecorded()).toBe(1);
  });

  it('sends only the flags when no quantity was typed, and nothing when nothing changed', () => {
    loadInventory();
    store.recordStock(2, 1, {inTransit: true, notes: 'Pedido a Lima'});
    http.expectNone(MOVEMENTS);
    http.expectNone(`${LEVELS}/3`);
    store.recordStock(2, 1, {inTransit: false});
    http.expectOne(`${LEVELS}/3`).flush({...levels[2], inTransit: false});
    expect(store.movementsRecorded()).toBe(0);
  });

  it('saves notes only when they change', () => {
    loadInventory();
    store.setNotes(2, 1, ' Pedido a Lima ');
    http.expectNone(`${LEVELS}/3`);
    store.setNotes(2, 1, 'Llega el lunes');
    http.expectOne(`${LEVELS}/3`).flush({...levels[2], notes: 'Llega el lunes'});
    expect(store.levelFor(2, 1)?.notes).toBe('Llega el lunes');
  });

  it('adds an item and records its initial stock in each site', () => {
    loadInventory();
    const input: NewItem = {
      glassTypeId: 5, productId: null, color: '', sku: '', widthCm: 244, heightCm: 183,
      packKind: 'CRATE', unitsPerPack: 20, minStock: 5, initialCounts: [{siteId: 1, quantity: 40}, {siteId: 2, quantity: 0}]
    };
    store.createItem(input);
    const create = http.expectOne(ITEMS);
    expect(create.request.body).toEqual({glassTypeId: 5, productId: null, color: '', sku: '', widthCm: 244, heightCm: 183, packKind: 'CRATE', unitsPerPack: 20, minStock: 5});
    create.flush({id: 3, ...create.request.body});
    const counts = http.match(MOVEMENTS);
    expect(counts.map(r => r.request.body)).toEqual([
      {itemId: 3, siteId: 1, kind: 'COUNT', quantity: 40, reason: 'Stock inicial'},
      {itemId: 3, siteId: 2, kind: 'COUNT', quantity: 0, reason: 'Stock inicial'},
    ]);
    counts[0].flush(movementResponse(3, 1, 40, 6));
    counts[1].flush(movementResponse(3, 2, 0, 7));
    expect(store.item(3)?.unitsPerPack).toBe(20);
    expect(store.totalQuantity(3)).toBe(40);
  });

  it('rejects an item without product, a half-typed size or pack, and a repeated item', () => {
    loadInventory();
    const base: NewItem = {glassTypeId: null, productId: null, color: '', sku: '', widthCm: null, heightCm: null, packKind: null, unitsPerPack: null, minStock: null, initialCounts: []};
    store.createItem(base);
    expect(store.error()).toBe('inventory.error.invalid-item');
    store.createItem({...base, productId: 40, widthCm: 100});
    expect(store.error()).toBe('inventory.error.invalid-size');
    store.createItem({...base, productId: 40, packKind: 'BOX'});
    expect(store.error()).toBe('inventory.error.invalid-pack');
    store.createItem({...base, productId: 40, color: ' negro '});
    expect(store.error()).toBe('inventory.error.duplicate-item');
    http.expectNone(ITEMS);
  });

  it('updates the details of an item without changing its product', () => {
    loadInventory();
    store.updateItem(1, {color: '', sku: 'V-01', widthCm: 330, heightCm: 214, packKind: 'CRATE', unitsPerPack: 25, minStock: 10});
    const req = http.expectOne(`${ITEMS}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.glassTypeId).toBeUndefined();
    expect(req.request.body).toMatchObject({sku: 'V-01', packKind: 'CRATE', unitsPerPack: 25});
    req.flush({...items[0], sku: 'V-01', packKind: 'CRATE', unitsPerPack: 25});
    expect(store.item(1)?.unitsPerPack).toBe(25);
  });

  it('reports a failed save', () => {
    loadInventory();
    store.count(1, 1, 30);
    http.expectOne(MOVEMENTS).flush({}, {status: 400, statusText: 'Bad Request'});
    expect(store.quantityAt(1, 1)).toBe(32);
    expect(store.error()).toBe('inventory.error.save');
  });
});
