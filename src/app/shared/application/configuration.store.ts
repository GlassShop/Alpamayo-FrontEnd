import {inject, Injectable, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

const LANG_KEY = 'alpamayo.lang';

@Injectable({providedIn: 'root'})
export class ConfigurationStore {
  private readonly translate = inject(TranslateService);
  readonly availableLangs = ['es', 'en'] as const;
  private readonly activeLangSignal = signal(this.resolveInitialLang());
  readonly activeLang = this.activeLangSignal.asReadonly();

  constructor() {
    this.translate.addLangs([...this.availableLangs]);
    this.applyLang(this.activeLangSignal());
  }

  setLanguage(lang: string): void {
    if (!this.availableLangs.includes(lang as 'es' | 'en')) return;
    try { globalThis.localStorage?.setItem(LANG_KEY, lang); } catch { /* storage unavailable: keep in memory only */ }
    this.activeLangSignal.set(lang);
    this.applyLang(lang);
  }

  private applyLang(lang: string): void {
    this.translate.use(lang);
  }

  private resolveInitialLang(): string {
    let stored: string | null = null;
    try { stored = globalThis.localStorage?.getItem(LANG_KEY) ?? null; } catch { /* storage unavailable */ }
    if (stored && this.availableLangs.includes(stored as 'es' | 'en')) return stored;
    return 'es';
  }
}
