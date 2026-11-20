import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {SaleSettingsStore} from './sale-settings.store';

const URL = `${environment.apiBaseUrl}${environment.saleSettingsEndpointPath}`;

describe('SaleSettingsStore', () => {
  let store: SaleSettingsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(SaleSettingsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the maximum discount once', () => {
    store.ensureLoaded();
    store.ensureLoaded();
    http.expectOne(URL).flush({maxDiscountPercent: 10});
    expect(store.maxDiscountPercent()).toBe(10);
    expect(store.loaded()).toBe(true);
  });

  it('treats a missing limit as not set', () => {
    store.load();
    http.expectOne(URL).flush({});
    expect(store.maxDiscountPercent()).toBeNull();
  });

  it('saves a new limit and can turn it off again', () => {
    store.setMaxDiscount(8);
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({maxDiscountPercent: 8});
    req.flush({maxDiscountPercent: 8});
    expect(store.maxDiscountPercent()).toBe(8);

    store.setMaxDiscount(null);
    http.expectOne(URL).flush({maxDiscountPercent: null});
    expect(store.maxDiscountPercent()).toBeNull();
  });

  it('rejects a limit outside 0–100 % without calling the API', () => {
    store.setMaxDiscount(120);
    expect(store.error()).toBe('catalog.discount.error.invalid');
  });
});
