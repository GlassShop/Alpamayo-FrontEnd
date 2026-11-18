import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {CustomerLookupStore} from './customer-lookup.store';

const url = (type: string, number: string) => `${environment.apiBaseUrl}${environment.documentLookupEndpointPath}/${type}/${number}`;

describe('CustomerLookupStore', () => {
  let store: CustomerLookupStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    store = TestBed.inject(CustomerLookupStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('finds a customer by DNI', () => {
    store.lookup('DNI', '45678912');
    expect(store.status()).toBe('searching');
    http.expectOne(url('DNI', '45678912')).flush({docType: 'DNI', docNumber: '45678912', name: 'Cliente Demo Uno', address: 'Jr. Ficticio 100'});
    expect(store.status()).toBe('found');
    expect(store.holder()).toEqual({docType: 'DNI', docNumber: '45678912', name: 'Cliente Demo Uno', address: 'Jr. Ficticio 100'});
  });

  it('reports "not found" so the seller can type the data by hand', () => {
    store.lookup('RUC', '20131312955');
    http.expectOne(url('RUC', '20131312955')).flush({}, {status: 404, statusText: 'Not Found'});
    expect(store.status()).toBe('not-found');
    expect(store.holder()).toBeNull();
  });

  it('reports an unavailable service separately', () => {
    store.lookup('DNI', '45678912');
    http.expectOne(url('DNI', '45678912')).flush({}, {status: 0, statusText: 'Unknown Error'});
    expect(store.status()).toBe('error');
  });

  it('does not query invalid documents and cancels an older search', () => {
    store.lookup('RUC', '20131312954');
    http.expectNone(() => true);
    expect(store.status()).toBe('idle');

    store.lookup('DNI', '45678912');
    store.lookup('DNI', '11112222');
    expect(http.expectOne(url('DNI', '45678912')).cancelled).toBe(true);
    http.expectOne(url('DNI', '11112222')).flush({docType: 'DNI', docNumber: '11112222', name: 'Otro'});
    expect(store.holder()?.name).toBe('Otro');
  });
});
