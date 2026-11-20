import {inject, Injectable, signal} from '@angular/core';
import {SaleSettingsApi} from '../infrastructure/sale-settings-api';

/**
 * Maximum discount sellers may give on a quote line, set by the CEO in the
 * catalog's "Editar precios" mode. While it is not set, the limit is 0 %.
 * Error values are translation keys.
 */
@Injectable({providedIn: 'root'})
export class SaleSettingsStore {
  private readonly api = inject(SaleSettingsApi);

  private readonly maxDiscountSignal = signal<number | null>(null);
  private readonly loadedSignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  /** In %, or null while the CEO has not set it. */
  readonly maxDiscountPercent = this.maxDiscountSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.get().subscribe({
      next: s => { this.maxDiscountSignal.set(s.maxDiscountPercent); this.loadedSignal.set(true); this.loadingSignal.set(false); },
      error: () => { this.errorSignal.set('catalog.discount.error.load'); this.loadingSignal.set(false); }
    });
  }

  ensureLoaded(): void {
    if (!this.loadedSignal() && !this.loadingSignal()) this.load();
  }

  /** Sets the maximum discount, 0 to 100 %, or null to allow none (CEO only). */
  setMaxDiscount(percent: number | null): void {
    if (percent !== null && !(Number.isFinite(percent) && percent >= 0 && percent <= 100)) {
      this.errorSignal.set('catalog.discount.error.invalid');
      return;
    }
    if (percent === this.maxDiscountSignal()) return;
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    this.api.setMaxDiscount(percent).subscribe({
      next: s => { this.maxDiscountSignal.set(s.maxDiscountPercent); this.savingSignal.set(false); },
      error: () => { this.errorSignal.set('catalog.discount.error.save'); this.savingSignal.set(false); }
    });
  }

  clearError(): void { this.errorSignal.set(null); }
}
