import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {StockMovementsStore} from './stock-movements.store';
import {InventoryStore} from './inventory.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const MOVEMENTS = url(environment.stockMovementsEndpointPath);

const movement = (id: number, itemId: number, siteId: number, delta: number, quantityAfter: number, at: string, reason?: string) =>
  ({id, itemId, siteId, kind: 'ADJUSTMENT', delta, quantityAfter, at, by: {id: 3, fullName: 'Almacén'}, ...(reason ? {reason} : {})});

describe('StockMovementsStore', () => {
  let store: StockMovementsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(StockMovementsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadMovements(): void {
    store.load();
    http.expectOne(MOVEMENTS).flush([
      movement(1, 10, 1, 5, 5, '2026-11-19T08:00:00Z'),
      movement(2, 10, 2, -1, 3, '2026-11-19T10:00:00Z', 'Plancha rota'),
      movement(3, 11, 1, 2, 2, '2026-11-19T09:00:00Z'),
    ]);
  }

  it('lists movements newest first, keeping the reason only when there is one', () => {
    loadMovements();
    expect(store.movements().map(m => m.id)).toEqual([2, 3, 1]);
    expect(store.movements()[0].reason).toBe('Plancha rota');
    expect(store.movements()[1].reason).toBeUndefined();
  });

  it('filters by item and by site', () => {
    loadMovements();
    store.showFor(10);
    expect(store.movements().map(m => m.id)).toEqual([2, 1]);
    store.siteId.set(1);
    expect(store.movements().map(m => m.id)).toEqual([1]);
    store.showFor(null);
    expect(store.movements().map(m => m.id)).toEqual([3, 1]);
  });

  it('reloads after a movement is recorded', () => {
    loadMovements();
    TestBed.inject(InventoryStore).count(11, 1, 4);
    http.expectOne(MOVEMENTS).flush({
      movement: movement(4, 11, 1, 2, 4, '2026-11-19T11:00:00Z'),
      level: {id: 8, itemId: 11, siteId: 1, quantity: 4},
    });
    TestBed.tick();
    http.expectOne(MOVEMENTS).flush([movement(4, 11, 1, 2, 4, '2026-11-19T11:00:00Z')]);
    expect(store.movements()[0].id).toBe(4);
  });

  it('reports a failed load', () => {
    store.load();
    http.expectOne(MOVEMENTS).flush({}, {status: 500, statusText: 'Error'});
    expect(store.error()).toBe('load');
  });
});
