import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {iamInterceptor} from './iam.interceptor';
import {signInAs} from '../../testing/iam-testing';

describe('iamInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const api = `${environment.apiBaseUrl}/prices`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([iamInterceptor])), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API requests only', () => {
    signInAs('SELLER');
    http.get(api).subscribe();
    http.get('https://fonts.googleapis.com/css2').subscribe();
    expect(backend.expectOne(api).request.headers.get('Authorization')).toBe('Bearer token-SELLER');
    expect(backend.expectOne('https://fonts.googleapis.com/css2').request.headers.has('Authorization')).toBe(false);
  });

  it('sends no token when nobody is signed in', () => {
    http.get(api).subscribe({error: () => undefined});
    expect(backend.expectOne(api).request.headers.has('Authorization')).toBe(false);
  });

  it('ends the session when the API answers 401', () => {
    const store = signInAs('SELLER');
    http.get(api).subscribe({error: () => undefined});
    backend.expectOne(api).flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(store.isSignedIn()).toBe(false);
  });

  it('keeps the session on other errors such as 403', () => {
    const store = signInAs('SELLER');
    http.get(api).subscribe({error: () => undefined});
    backend.expectOne(api).flush({}, {status: 403, statusText: 'Forbidden'});
    expect(store.isSignedIn()).toBe(true);
  });
});
