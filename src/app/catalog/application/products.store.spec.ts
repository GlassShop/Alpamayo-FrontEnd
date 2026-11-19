import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {ProductsStore} from './products.store';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;
const SERIES = url(environment.seriesEndpointPath);
const PRODUCTS = url(environment.productsEndpointPath);

/** Test fixtures only: real prices always come from the API. */
const series = [{id: 1, name: 'Serie 80'}, {id: 3, name: 'Serie 62'}];
const products = [
  {id: 10, category: 'ALUMINUM_SERIES', code: '6002', name: 'Traslape hoja', seriesId: 3, publicPrice: 75},
  {id: 11, category: 'ALUMINUM_SERIES', code: '6001', name: 'Marco doble corredizo', seriesId: 3, publicPrice: 190},
  {id: 12, category: 'ALUMINUM_SERIES', code: '8001', name: 'Marco doble corredizo', seriesId: 1, publicPrice: null},
  {id: 20, category: 'ACCESSORY', name: 'Bisagra 3" x 3"', brand: 'Parma', publicPrice: null},
];

describe('ProductsStore', () => {
  let store: ProductsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(ProductsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadProducts(): void {
    store.load();
    http.expectOne(SERIES).flush(series);
    http.expectOne(PRODUCTS).flush(products);
  }

  it('loads series and products, filling missing optional fields', () => {
    loadProducts();
    expect(store.loaded()).toBe(true);
    const accessory = store.product(20)!;
    expect(accessory).toMatchObject({code: '', seriesId: null, weightClass: null, brand: 'Parma', publicPrice: null});
  });

  it('reports a failed load', () => {
    store.load();
    http.expectOne(SERIES).flush({}, {status: 500, statusText: 'Error'});
    http.match(() => true); // the parallel request is cancelled
    expect(store.error()).toBe('catalog.products.error.load');
  });

  it('lists a category by series and code, and counts the products without price', () => {
    loadProducts();
    expect(store.byCategory('ALUMINUM_SERIES').map(p => p.code)).toEqual(['6001', '6002', '8001']);
    expect(store.missingPrices('ALUMINUM_SERIES')).toBe(1);
    expect(store.missingPrices('ACCESSORY')).toBe(1);
  });

  it('sets a public price with PATCH and the reason for the history', () => {
    loadProducts();
    store.setPublicPrice(12, 205, ' Lista nueva ');
    const req = http.expectOne(`${PRODUCTS}/12`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({publicPrice: 205, changeReason: 'Lista nueva'});
    req.flush({...products[2], publicPrice: 205});
    expect(store.product(12)?.publicPrice).toBe(205);
    expect(store.priceSaves()).toBe(1);
  });

  it('does not send an unchanged or invalid price', () => {
    loadProducts();
    store.setPublicPrice(11, 190);
    store.setPublicPrice(11, 0);
    http.expectNone(`${PRODUCTS}/11`);
    expect(store.error()).toBe('catalog.products.error.invalid-price');
  });

  it('keeps the old price and reports the error when saving fails', () => {
    loadProducts();
    store.setPublicPrice(11, 200);
    http.expectOne(`${PRODUCTS}/11`).flush({}, {status: 403, statusText: 'Forbidden'});
    expect(store.product(11)?.publicPrice).toBe(190);
    expect(store.error()).toBe('catalog.products.error.save');
  });

  it('adds a product without price and only with the fields of its category', () => {
    loadProducts();
    store.createProduct({category: 'ACCESSORY', code: '', name: ' Pestillo ', seriesId: 3, brand: ' Alemar ', weightClass: 'LIGHT'});
    const req = http.expectOne(PRODUCTS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({category: 'ACCESSORY', code: '', name: 'Pestillo', seriesId: null, brand: 'Alemar', weightClass: null, publicPrice: null});
    req.flush({id: 21, ...req.request.body});
    expect(store.byCategory('ACCESSORY').length).toBe(2);
  });

  it('rejects a series profile without series and a repeated code in the same series', () => {
    loadProducts();
    store.createProduct({category: 'ALUMINUM_SERIES', code: '6003', name: 'Marco monolítico', seriesId: null, brand: '', weightClass: null});
    expect(store.error()).toBe('catalog.products.error.invalid-product');
    store.createProduct({category: 'ALUMINUM_SERIES', code: '6001', name: 'Otro', seriesId: 3, brand: '', weightClass: null});
    expect(store.error()).toBe('catalog.products.error.duplicate');
    http.expectNone(PRODUCTS);
  });
});
