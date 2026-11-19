import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {PurchasesStore} from './purchases.store';
import {InventoryStore} from '../../inventory/application/inventory.store';
import {ArrivalCommand} from '../infrastructure/purchases-api';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const PURCHASES = url(environment.purchasesEndpointPath);

const by = {id: 3, fullName: 'Almacén'};
/** As a seller or warehouse user receives it: no amounts. */
const pending = {
  id: 1, date: '2026-11-18', supplier: 'Vidrios Lima', siteId: 2, status: 'PENDING_COST', createdBy: by, createdAt: '2026-11-18T10:00:00Z',
  lines: [{itemId: 10, quantity: 60, packs: 3}, {itemId: 11, quantity: 200}],
};
const costed = {
  ...pending, id: 2, date: '2026-11-20', supplier: 'Aluminios del Sur', status: 'COSTED',
  costs: {exchangeRate: 3.75, freight: {amount: 600, currency: 'PEN'}, transport: {amount: 0, currency: 'PEN'}},
  lines: [{itemId: 10, quantity: 60, packs: 3, unitPriceUsd: 45, unitCost: 177.75}, {itemId: 11, quantity: 200, unitPriceUsd: 1.5, unitCost: 5.925}],
  costedBy: {id: 1, fullName: 'Gerencia'}, costedAt: '2026-11-20T12:00:00Z',
};

const arrival: ArrivalCommand = {
  date: '2026-11-21', supplier: ' Vidrios Lima ', siteId: 1, notes: '',
  lines: [{itemId: 10, quantity: 40, packs: 2}, {itemId: 12, quantity: 5, packs: null}]
};

describe('PurchasesStore', () => {
  let store: PurchasesStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(PurchasesStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadPurchases(): void {
    store.load();
    http.expectOne(PURCHASES).flush([pending, costed]);
  }

  it('lists purchases newest first and counts the ones waiting for costs', () => {
    loadPurchases();
    expect(store.purchases().map(p => p.id)).toEqual([2, 1]);
    expect(store.pendingCount()).toBe(1);
    expect(store.suppliers()).toEqual(['Aluminios del Sur', 'Vidrios Lima']);
  });

  it('reads purchases without amounts as null, as other roles receive them', () => {
    loadPurchases();
    const p = store.purchase(1)!;
    expect(p.costs).toBeNull();
    expect(p.lines[1]).toEqual({itemId: 11, quantity: 200, packs: null, unitPriceUsd: null, unitCost: null});
    expect(store.purchase(2)!.lines[0].unitCost).toBe(177.75);
  });

  it('registers an arrival and gives the inventory the stock levels it changed', () => {
    loadPurchases();
    const inventory = TestBed.inject(InventoryStore);
    store.registerArrival(arrival);
    const req = http.expectOne(PURCHASES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.supplier).toBe('Vidrios Lima');
    expect(req.request.body.lines).toEqual(arrival.lines);
    req.flush({
      purchase: {...pending, id: 3, date: '2026-11-21', siteId: 1, lines: arrival.lines},
      levels: [{id: 50, itemId: 10, siteId: 1, quantity: 72}, {id: 51, itemId: 12, siteId: 1, quantity: 5}],
    });
    expect(store.purchases()[0].id).toBe(3);
    expect(inventory.quantityAt(10, 1)).toBe(72);
    expect(inventory.movementsRecorded()).toBe(1);
  });

  it('rejects an arrival without supplier, lines, whole quantities or with an item twice', () => {
    store.registerArrival({...arrival, supplier: ' '});
    expect(store.error()).toBe('purchases.error.missing-supplier');
    store.registerArrival({...arrival, lines: []});
    expect(store.error()).toBe('purchases.error.no-lines');
    store.registerArrival({...arrival, lines: [{itemId: 10, quantity: 2.5, packs: null}]});
    expect(store.error()).toBe('purchases.error.invalid-quantity');
    store.registerArrival({...arrival, lines: [{itemId: 10, quantity: 1, packs: null}, {itemId: 10, quantity: 2, packs: null}]});
    expect(store.error()).toBe('purchases.error.repeated-item');
    store.registerArrival({...arrival, date: '21/11/2026'});
    expect(store.error()).toBe('purchases.error.invalid-date');
    http.expectNone(PURCHASES);
  });

  it('costs a purchase and keeps what the server worked out', () => {
    loadPurchases();
    const command = {
      exchangeRate: 3.75, freight: {amount: 600, currency: 'PEN' as const}, transport: {amount: 40, currency: 'USD' as const},
      unitPricesUsd: [45, 1.5]
    };
    store.setCosts(1, command);
    const req = http.expectOne(`${PURCHASES}/1/costs`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(command);
    req.flush({...costed, id: 1, costs: {exchangeRate: 3.75, freight: command.freight, transport: command.transport}});
    expect(store.purchase(1)?.status).toBe('COSTED');
    expect(store.pendingCount()).toBe(0);
  });

  it('rejects costs without exchange rate, with a negative freight or a missing price', () => {
    loadPurchases();
    const ok = {exchangeRate: 3.75, freight: {amount: 0, currency: 'PEN' as const}, transport: {amount: 0, currency: 'PEN' as const}, unitPricesUsd: [45, 1.5]};
    store.setCosts(1, {...ok, exchangeRate: 0});
    store.setCosts(1, {...ok, freight: {amount: -5, currency: 'PEN'}});
    store.setCosts(1, {...ok, unitPricesUsd: [45]});
    store.setCosts(1, {...ok, unitPricesUsd: [45, 0]});
    expect(store.error()).toBe('purchases.error.invalid-costs');
    http.expectNone(`${PURCHASES}/1/costs`);
  });

  it('reports failed loads and saves', () => {
    store.load();
    http.expectOne(PURCHASES).flush({}, {status: 500, statusText: 'Error'});
    expect(store.error()).toBe('purchases.error.load');
    store.registerArrival(arrival);
    http.expectOne(PURCHASES).flush({}, {status: 400, statusText: 'Bad Request'});
    expect(store.error()).toBe('purchases.error.save');
    expect(store.saving()).toBe(false);
  });
});
