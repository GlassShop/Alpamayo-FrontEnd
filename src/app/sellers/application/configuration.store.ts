import {inject, Injectable, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

const LANG_KEY = 'alpamayo.lang';

@Injectable({providedIn: 'root'})
export class ConfigurationStore {
  private readonly translate = inject(TranslateService);
  private readonly activeLangSignal = signal(this.resolveInitialLang());

  readonly activeLang = this.activeLangSignal.asReadonly();
  readonly availableLangs = ['es', 'en'] as const;

  constructor() {
    this.translate.addLangs([...this.availableLangs]);
    this.applyLang(this.activeLangSignal());
  }

  setLanguage(lang: string): void {
    if (!this.availableLangs.includes(lang as 'es' | 'en')) return;
    localStorage.setItem(LANG_KEY, lang);
    this.activeLangSignal.set(lang);
    this.applyLang(lang);
  }

  private applyLang(lang: string): void {
    this.translate.use(lang);
  }

  private resolveInitialLang(): string {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && this.availableLangs.includes(stored as 'es' | 'en')) return stored;
    return 'es';
  }
}
