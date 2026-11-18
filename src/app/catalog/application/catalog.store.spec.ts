import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {CatalogStore} from './catalog.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const GLASS  = url(environment.glassTypesEndpointPath);
const LISTS  = url(environment.priceListsEndpointPath);
const PRICES = url(environment.pricesEndpointPath);

/** Test fixtures only: real prices always come from the API. */
const glassTypes = [{id: 1, name: 'Laminado', thicknessMm: 6, color: 'cielo'}];
const priceLists = [{id: 1, name: 'Pública'}, {id: 2, name: 'Vidriero'}];
const prices     = [{id: 10, glassTypeId: 1, priceListId: 1, pricePerSqFt: 8}];

describe('CatalogStore', () => {
  let store: CatalogStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(CatalogStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadCatalog(): void {
    store.load();
    http.expectOne(GLASS).flush(glassTypes);
    http.expectOne(LISTS).flush(priceLists);
    http.expectOne(PRICES).flush(prices);
  }

  it('loads glass types, price lists and prices from the API', () => {
    loadCatalog();
    expect(store.glassTypes()).toEqual(glassTypes);
    expect(store.priceLists().map(l => l.name)).toEqual(['Pública', 'Vidriero']);
    expect(store.loading()).toBe(false);
    expect(store.loaded()).toBe(true);
  });

  it('returns the CEO price for a glass type in a list, or null when not set', () => {
    loadCatalog();
    expect(store.priceFor(1, 1)).toBe(8);
    expect(store.priceFor(1, 2)).toBeNull();
  });

  it('updates an existing price with PUT', () => {
    loadCatalog();
    store.setPrice(1, 1, 9.5);
    const req = http.expectOne(`${PRICES}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.pricePerSqFt).toBe(9.5);
    req.flush({...prices[0], pricePerSqFt: 9.5});
    expect(store.priceFor(1, 1)).toBe(9.5);
  });

  it('creates a price that did not exist yet with POST, without sending id 0', () => {
    loadCatalog();
    store.setPrice(1, 2, 7);
    const req = http.expectOne(PRICES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.id).toBeUndefined();
    req.flush({id: 11, glassTypeId: 1, priceListId: 2, pricePerSqFt: 7});
    expect(store.priceFor(1, 2)).toBe(7);
  });

  it('sends the reason for the price history only when there is one', () => {
    loadCatalog();
    store.setPrice(1, 1, 9.5, '  Subió el proveedor  ');
    const withReason = http.expectOne(`${PRICES}/10`);
    expect(withReason.request.body.changeReason).toBe('Subió el proveedor');
    withReason.flush({...prices[0], pricePerSqFt: 9.5});
    expect(store.priceSaves()).toBe(1);

    store.setPrice(1, 1, 9.8);
    const withoutReason = http.expectOne(`${PRICES}/10`);
    expect('changeReason' in withoutReason.request.body).toBe(false);
    withoutReason.flush({...prices[0], pricePerSqFt: 9.8});
  });

  it('rejects zero or negative prices without calling the API', () => {
    loadCatalog();
    store.setPrice(1, 1, 0);
    store.setPrice(1, 1, -3);
    http.expectNone(`${PRICES}/10`);
    expect(store.error()).toBe('catalog.error.invalid-price');
    expect(store.priceFor(1, 1)).toBe(8);
  });

  it('creates a new price list and rejects duplicates', () => {
    loadCatalog();
    store.createPriceList('  Constructora ');
    const req = http.expectOne(LISTS);
    expect(req.request.body).toEqual({name: 'Constructora'});
    req.flush({id: 3, name: 'Constructora'});
    expect(store.priceLists().length).toBe(3);

    store.createPriceList('pública');
    expect(store.error()).toBe('catalog.error.duplicate-list');
  });

  it('creates a new glass type', () => {
    loadCatalog();
    store.createGlassType('Espejo doble', 4, 'plata');
    http.expectOne(GLASS).flush({id: 2, name: 'Espejo doble', thicknessMm: 4, color: 'plata'});
    expect(store.glassTypes().length).toBe(2);
  });

  it('exposes a translatable error when the API is down, with no invented data', () => {
    store.load();
    http.expectOne(GLASS).flush('down', {status: 0, statusText: 'Unknown Error'});
    http.match(LISTS);
    http.match(PRICES);
    expect(store.error()).toBe('catalog.error.load');
    expect(store.glassTypes()).toEqual([]);
    expect(store.loading()).toBe(false);
  });
});
