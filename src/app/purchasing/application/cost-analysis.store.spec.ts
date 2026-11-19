import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {CostAnalysisStore} from './cost-analysis.store';
import {PurchasesStore} from './purchases.store';
import {InventoryStore} from '../../inventory/application/inventory.store';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {ProductsStore} from '../../catalog/application/products.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const SETTINGS = url(environment.costSettingsEndpointPath);

const by = {id: 1, fullName: 'Gerencia'};
const costs = {exchangeRate: 3.75, freight: {amount: 0, currency: 'PEN'}, transport: {amount: 0, currency: 'PEN'}};
const purchase = (id: number, date: string, lines: {itemId: number; quantity: number; unitCost: number}[]) => ({
  id, date, supplier: 'Proveedor', siteId: 1, status: 'COSTED', costs, createdBy: by, createdAt: `${date}T10:00:00Z`,
  lines: lines.map(l => ({...l, unitPriceUsd: 1})),
});

describe('CostAnalysisStore', () => {
  let store: CostAnalysisStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(CostAnalysisStore);
    http = TestBed.inject(HttpTestingController);

    TestBed.inject(CatalogStore).load();
    http.expectOne(url(environment.glassTypesEndpointPath)).flush([{id: 5, name: 'Laminado', thicknessMm: 6, color: 'incoloro'}]);
    http.expectOne(url(environment.priceListsEndpointPath)).flush([{id: 2, name: 'Vidriero'}, {id: 1, name: 'Pública'}]);
    http.expectOne(url(environment.pricesEndpointPath)).flush([
      {id: 1, glassTypeId: 5, priceListId: 1, pricePerSqFt: 3},
      {id: 2, glassTypeId: 5, priceListId: 2, pricePerSqFt: 2.5},
    ]);

    TestBed.inject(ProductsStore).load();
    http.expectOne(url(environment.seriesEndpointPath)).flush([]);
    http.expectOne(url(environment.productsEndpointPath)).flush([
      {id: 40, category: 'ACCESSORY', name: 'Bisagra 3" x 3"', publicPrice: 8},
      {id: 41, category: 'ACCESSORY', name: 'Pestillo', publicPrice: null},
    ]);

    TestBed.inject(InventoryStore).load();
    http.expectOne(url(environment.sitesEndpointPath)).flush([{id: 1, name: 'Principal'}, {id: 2, name: 'Almacén'}]);
    http.expectOne(url(environment.inventoryItemsEndpointPath)).flush([
      {id: 10, glassTypeId: 5, widthCm: 330, heightCm: 214},
      {id: 11, productId: 40, color: 'Negro'},
      {id: 12, productId: 41, color: 'Mate'},
      {id: 13, productId: 40, color: 'Mate'},
    ]);
    http.expectOne(url(environment.stockLevelsEndpointPath)).flush([
      {id: 1, itemId: 10, siteId: 1, quantity: 10},
      {id: 2, itemId: 11, siteId: 1, quantity: 100},
      {id: 3, itemId: 11, siteId: 2, quantity: 20},
      {id: 4, itemId: 13, siteId: 1, quantity: 7},
    ]);

    TestBed.inject(PurchasesStore).load();
    http.expectOne(url(environment.purchasesEndpointPath)).flush([
      purchase(1, '2026-10-01', [{itemId: 10, quantity: 60, unitCost: 177.75}, {itemId: 11, quantity: 200, unitCost: 5}]),
      purchase(2, '2026-11-01', [{itemId: 11, quantity: 100, unitCost: 7}]),
      {...purchase(3, '2026-11-15', [{itemId: 12, quantity: 10, unitCost: 2}]), status: 'PENDING_COST'},
    ]);
  });

  afterEach(() => http.verify());

  it('compares glass per square foot with its public price list', () => {
    const glass = store.itemAnalysis(10)!;
    expect(glass.perSqFt).toBe(true);
    expect(glass.salePrice).toBe(3);
    expect(glass.comparableCost).toBeCloseTo(2.2653, 4);
    expect(glass.margin).toBeCloseTo(0.2449, 4);
  });

  it('uses the last cost for the margin and keeps the weighted average for the stock value', () => {
    const hinge = store.itemAnalysis(11)!;
    expect(hinge.summary).toMatchObject({last: 7, previous: 5, changePercent: 40, purchases: 2});
    expect(hinge.summary!.average).toBeCloseTo((200 * 5 + 100 * 7) / 300, 6);
    expect(hinge.margin).toBeCloseTo(0.125, 6);
  });

  it('has no margin without a costed purchase or without a public price', () => {
    expect(store.itemAnalysis(12)).toMatchObject({summary: null, salePrice: null, margin: null}); // purchase still pending
    expect(store.itemAnalysis(13)).toMatchObject({summary: null, salePrice: 8, margin: null});
  });

  it('values the stock per site at average cost and counts the items with stock but no cost', () => {
    const [principal, almacen] = store.siteValues();
    const hingeAverage = (200 * 5 + 100 * 7) / 300;
    expect(principal.value).toBeCloseTo(10 * 177.75 + 100 * hingeAverage, 6);
    expect(principal.withoutCost).toBe(1);
    expect(almacen.value).toBeCloseTo(20 * hingeAverage, 6);
    expect(almacen.withoutCost).toBe(0);
  });

  it('warns about low margins only after the CEO sets a minimum', () => {
    expect(store.lowMarginCount()).toBe(0);
    store.loadSettings();
    http.expectOne(SETTINGS).flush({minMarginPercent: 20});
    expect(store.itemAnalysis(11)!.lowMargin).toBe(true);
    expect(store.itemAnalysis(10)!.lowMargin).toBe(false);
    expect(store.lowMarginCount()).toBe(1);
  });

  it('saves the minimum margin and rejects one out of range', () => {
    store.setMinMargin(150);
    expect(store.settingsError()).toBe('costs.error.invalid-margin');
    http.expectNone(SETTINGS);
    store.setMinMargin(25);
    const req = http.expectOne(SETTINGS);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({minMarginPercent: 25});
    req.flush({minMarginPercent: 25});
    expect(store.minMarginPercent()).toBe(25);
    expect(store.lowMarginCount()).toBe(2);
  });
});
