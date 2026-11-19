import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {ProductPriceHistoryStore} from './product-price-history.store';
import {ProductsStore} from './products.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const HISTORY = url(environment.productPriceHistoryEndpointPath);
const SERIES = url(environment.seriesEndpointPath);
const PRODUCTS = url(environment.productsEndpointPath);

const change = (id: number, productId: number, previousPrice: number | null, newPrice: number, changedAt: string, reason?: string) =>
  ({id, productId, label: `#${productId}`, previousPrice, newPrice, changedAt, changedBy: {id: 1, fullName: 'Gerencia'}, ...(reason ? {reason} : {})});

describe('ProductPriceHistoryStore', () => {
  let store: ProductPriceHistoryStore;
  let products: ProductsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(ProductPriceHistoryStore);
    products = TestBed.inject(ProductsStore);
    http = TestBed.inject(HttpTestingController);
    products.load();
    http.expectOne(SERIES).flush([{id: 1, name: 'Serie 62'}]);
    http.expectOne(PRODUCTS).flush([
      {id: 10, category: 'ALUMINUM_SERIES', code: '6001', name: 'Marco', seriesId: 1, publicPrice: 190},
      {id: 20, category: 'ACCESSORY', name: 'Pestillo', publicPrice: 5},
    ]);
  });

  afterEach(() => http.verify());

  function loadHistory(): void {
    store.load();
    http.expectOne(HISTORY).flush([
      change(1, 10, null, 175, '2026-11-19T08:00:00Z'),
      change(2, 10, 175, 190, '2026-11-19T10:00:00Z', 'Subió el proveedor'),
      change(3, 20, null, 5, '2026-11-19T09:00:00Z'),
    ]);
  }

  it('lists changes newest first, keeping the reason only when there is one', () => {
    loadHistory();
    expect(store.changes().map(c => c.id)).toEqual([2, 3, 1]);
    expect(store.changes()[0].reason).toBe('Subió el proveedor');
    expect(store.changes()[1].reason).toBeUndefined();
  });

  it('filters by category and by product', () => {
    loadHistory();
    store.showCategory('ACCESSORY');
    expect(store.changes().map(c => c.id)).toEqual([3]);
    store.showFor(10);
    expect(store.changes().map(c => c.id)).toEqual([2, 1]);
    expect(store.isFiltered()).toBe(true);
    expect(store.hasHistory(10)).toBe(true);
    expect(store.hasHistory(99)).toBe(false);
  });

  it('reloads after a price is saved', () => {
    loadHistory();
    products.setPublicPrice(20, 6, 'Ajuste');
    http.expectOne(`${PRODUCTS}/20`).flush({id: 20, category: 'ACCESSORY', name: 'Pestillo', publicPrice: 6});
    TestBed.tick();
    http.expectOne(HISTORY).flush([change(4, 20, 5, 6, '2026-11-19T11:00:00Z', 'Ajuste')]);
    expect(store.changes()[0]).toMatchObject({previousPrice: 5, newPrice: 6, reason: 'Ajuste'});
  });

  it('reports a failed load', () => {
    store.load();
    http.expectOne(HISTORY).flush({}, {status: 403, statusText: 'Forbidden'});
    expect(store.error()).toBe('load');
  });
});
