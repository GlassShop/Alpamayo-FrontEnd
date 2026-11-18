import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {PriceHistoryStore} from './price-history.store';
import {CatalogStore} from './catalog.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const HISTORY = url(environment.priceHistoryEndpointPath);
const PRICES = url(environment.pricesEndpointPath);

const change = (id: number, glassTypeId: number, priceListId: number, previousPrice: number | null, newPrice: number, changedAt: string, reason?: string) =>
  ({id, priceId: id, glassTypeId, priceListId, previousPrice, newPrice, changedAt, changedBy: {id: 1, fullName: 'Gerencia'}, ...(reason ? {reason} : {})});

describe('PriceHistoryStore', () => {
  let store: PriceHistoryStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(PriceHistoryStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadHistory(): void {
    store.load();
    http.expectOne(HISTORY).flush([
      change(1, 1, 1, null, 8, '2026-11-18T08:00:00Z', 'Precio inicial'),
      change(2, 1, 1, 8, 9, '2026-11-18T10:00:00Z', 'Subió el proveedor'),
      change(3, 2, 1, null, 6.5, '2026-11-18T09:00:00Z'),
    ]);
  }

  it('lists changes newest first', () => {
    loadHistory();
    expect(store.changes().map(c => c.id)).toEqual([2, 3, 1]);
    expect(store.changes()[0].reason).toBe('Subió el proveedor');
    expect(store.changes()[1].reason).toBeUndefined();
  });

  it('filters by glass type and price list, and shows everything again', () => {
    loadHistory();
    store.showFor(1, 1);
    expect(store.changes().map(c => c.id)).toEqual([2, 1]);
    expect(store.isFiltered()).toBe(true);
    store.showAll();
    expect(store.changes().length).toBe(3);
  });

  it('knows which cells have history', () => {
    loadHistory();
    expect(store.hasHistory(1, 1)).toBe(true);
    expect(store.hasHistory(1, 2)).toBe(false);
  });

  it('reloads after a price is saved, so the new change appears at the top', () => {
    loadHistory();
    const catalog = TestBed.inject(CatalogStore);
    catalog.load();
    http.expectOne(url(environment.glassTypesEndpointPath)).flush([{id: 1, name: 'Laminado', thicknessMm: 6, color: 'cielo'}]);
    http.expectOne(url(environment.priceListsEndpointPath)).flush([{id: 1, name: 'Pública'}]);
    http.expectOne(PRICES).flush([{id: 1, glassTypeId: 1, priceListId: 1, pricePerSqFt: 9}]);

    catalog.setPrice(1, 1, 9.5, 'Ajuste');
    http.expectOne(`${PRICES}/1`).flush({id: 1, glassTypeId: 1, priceListId: 1, pricePerSqFt: 9.5});
    TestBed.tick();
    http.expectOne(HISTORY).flush([
      change(4, 1, 1, 9, 9.5, '2026-11-18T11:00:00Z', 'Ajuste'),
      change(2, 1, 1, 8, 9, '2026-11-18T10:00:00Z'),
    ]);
    expect(store.changes()[0]).toMatchObject({previousPrice: 9, newPrice: 9.5, reason: 'Ajuste'});
  });

  it('reports a failed load', () => {
    store.load();
    http.expectOne(HISTORY).flush({}, {status: 403, statusText: 'Forbidden'});
    expect(store.error()).toBe('load');
  });
});
