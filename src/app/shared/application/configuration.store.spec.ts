import {TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {ConfigurationStore} from './configuration.store';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    get length() { return data.size; }, clear: () => data.clear(), key: () => null,
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

describe('ConfigurationStore', () => {
  let translate: {addLangs: ReturnType<typeof vi.fn>; use: ReturnType<typeof vi.fn>};

  function createStore(saved: Record<string, string> = {}): ConfigurationStore {
    vi.stubGlobal('localStorage', fakeStorage(saved));
    translate = {addLangs: vi.fn(), use: vi.fn()};
    TestBed.configureTestingModule({providers: [{provide: TranslateService, useValue: translate}]});
    return TestBed.inject(ConfigurationStore);
  }

  afterEach(() => vi.unstubAllGlobals());

  it('starts in Spanish when no language was saved', () => {
    const store = createStore();
    expect(store.activeLang()).toBe('es');
    expect(translate.use).toHaveBeenCalledWith('es');
  });

  it('restores the language saved in a previous visit', () => {
    const store = createStore({'alpamayo.lang': 'en'});
    expect(store.activeLang()).toBe('en');
    expect(translate.use).toHaveBeenCalledWith('en');
  });

  it('ignores a saved language the app does not offer', () => {
    const store = createStore({'alpamayo.lang': 'fr'});
    expect(store.activeLang()).toBe('es');
  });

  it('saves the chosen language and ignores unknown ones', () => {
    const store = createStore();
    store.setLanguage('en');
    expect(store.activeLang()).toBe('en');
    expect(localStorage.getItem('alpamayo.lang')).toBe('en');

    store.setLanguage('fr');
    expect(store.activeLang()).toBe('en');
  });
});
