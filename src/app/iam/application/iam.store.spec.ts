import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {IamStore, safeReturnUrl} from './iam.store';
import {SignInCommand} from '../domain/model/sign-in.command';
import {SIGN_IN_URL, signInAs, signInResponse} from '../../testing/iam-testing';

/** In-memory localStorage, since the test environment has none. */
function fakeStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k: string) => data.get(k) ?? null,
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, String(v)); },
  };
}

describe('IamStore', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    vi.stubGlobal('localStorage', fakeStorage());
    TestBed.configureTestingModule({providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]});
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('signs in, keeps the role and returns to the requested page', () => {
    const store = TestBed.inject(IamStore);
    store.signIn(new SignInCommand({username: ' vendedora ', password: 'secret-123'}), '/catalogo');
    const req = http.expectOne(SIGN_IN_URL);
    expect(req.request.body).toEqual({username: 'vendedora', password: 'secret-123'});
    req.flush(signInResponse('SELLER'));

    expect(store.isSignedIn()).toBe(true);
    expect(store.currentUser()?.role).toBe('SELLER');
    expect(store.can('quote')).toBe(true);
    expect(store.can('prices.manage')).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/catalogo');
  });

  it('explains why a sign-in failed', () => {
    const store = TestBed.inject(IamStore);
    const attempt = (status: number) => {
      store.signIn(new SignInCommand({username: 'x', password: 'y'}));
      http.expectOne(SIGN_IN_URL).flush({}, {status, statusText: 'x'});
      return store.signInError();
    };
    expect(attempt(401)).toBe('invalid-credentials');
    expect(attempt(403)).toBe('inactive');
    expect(attempt(0)).toBe('unavailable');
    expect(store.isSignedIn()).toBe(false);
  });

  it('restores the session after a reload but never an expired one', () => {
    signInAs('CEO');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]});
    expect(TestBed.inject(IamStore).currentUser()?.role).toBe('CEO');

    const stored = JSON.parse(localStorage.getItem('alpamayo.session')!);
    localStorage.setItem('alpamayo.session', JSON.stringify({...stored, expiresAt: Date.now() - 1}));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]});
    expect(TestBed.inject(IamStore).isSignedIn()).toBe(false);
  });

  it('caps the session at one 8-hour shift even if the server grants more', () => {
    const store = signInAs('SELLER', {expiresInMs: 48 * 3_600_000});
    expect(store.hasValidSession()).toBe(true);
    const stored = JSON.parse(localStorage.getItem('alpamayo.session')!);
    expect(stored.expiresAt - Date.now()).toBeLessThanOrEqual(8 * 3_600_000);
  });

  it('never stores the password', () => {
    signInAs('SELLER');
    expect(localStorage.getItem('alpamayo.session')).not.toContain('secret-123');
  });

  it('signs out, clears the stored session and goes to sign in', () => {
    const store = signInAs('CEO');
    store.signOut('/usuarios');
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('alpamayo.session')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {queryParams: {volver: '/usuarios'}});
  });

  it('only accepts internal return URLs', () => {
    expect(safeReturnUrl('/catalogo')).toBe('/catalogo');
    expect(safeReturnUrl('https://evil.example')).toBe('/cotizador');
    expect(safeReturnUrl('//evil.example')).toBe('/cotizador');
    expect(safeReturnUrl('/iniciar-sesion')).toBe('/cotizador');
    expect(safeReturnUrl(null)).toBe('/cotizador');
  });
});
