import {TestBed} from '@angular/core/testing';
import type {MockInstance} from 'vitest';
import {AppErrorStore} from './app-error.store';

function fakeSession(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; }, clear: () => data.clear(), key: () => null,
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

describe('AppErrorStore', () => {
  let store: AppErrorStore;
  let reload: MockInstance<() => void>;

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', fakeSession());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    store = TestBed.inject(AppErrorStore);
    reload = vi.spyOn(store, 'reload').mockImplementation(() => undefined);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('reloads once when a page chunk cannot be downloaded (stale tab)', () => {
    store.handleNavigationError(new TypeError('Failed to fetch dynamically imported module: http://localhost:4200/chunk-X.js'));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(store.error()).toBeNull();
  });

  it('shows the error instead of reloading in a loop when it happens again', () => {
    store.handleNavigationError(new TypeError('Importing a module script failed.'));
    store.handleNavigationError(new TypeError('Importing a module script failed.'));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(store.error()).toBe('Importing a module script failed.');
  });

  it('shows any other navigation error instead of a blank screen', () => {
    store.handleNavigationError(new Error('Something broke in a guard'));
    expect(reload).not.toHaveBeenCalled();
    expect(store.error()).toBe('Something broke in a guard');
    store.dismiss();
    expect(store.error()).toBeNull();
  });
});
