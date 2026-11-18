import {computed, inject, Injectable, signal} from '@angular/core';
import {forkJoin, Observable, tap} from 'rxjs';
import {CatalogApi} from '../infrastructure/catalog-api';
import {GlassType} from '../domain/model/glass-type.entity';
import {PriceList} from '../domain/model/price-list.entity';
import {Price} from '../domain/model/price.entity';

/**
 * Catalog state: glass types, price lists and the price per square foot
 * the CEO set for each glass type in each list.
 *
 * @remarks
 * Every price comes from the API. Nothing here is hard-coded.
 * Error values are translation keys so views can show them in Spanish.
 */
@Injectable({providedIn: 'root'})
export class CatalogStore {
  private readonly api = inject(CatalogApi);

  private readonly glassTypesSignal = signal<GlassType[]>([]);
  private readonly priceListsSignal = signal<PriceList[]>([]);
  private readonly pricesSignal     = signal<Price[]>([]);
  private readonly loadingSignal    = signal(false);
  private readonly savingSignal     = signal(false);
  private readonly errorSignal      = signal<string | null>(null);
  private readonly loadedSignal     = signal(false);

  readonly glassTypes = this.glassTypesSignal.asReadonly();
  readonly priceLists = this.priceListsSignal.asReadonly();
  readonly prices     = this.pricesSignal.asReadonly();
  readonly loading    = this.loadingSignal.asReadonly();
  readonly saving     = this.savingSignal.asReadonly();
  readonly error      = this.errorSignal.asReadonly();
  readonly loaded     = this.loadedSignal.asReadonly();

  /** Price lookup indexed by "glassTypeId:priceListId". */
  private readonly priceIndex = computed(() =>
    new Map(this.pricesSignal().map(p => [this.key(p.glassTypeId, p.priceListId), p]))
  );

  /** Loads glass types, price lists and prices in parallel. */
  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      glassTypes: this.api.getGlassTypes(),
      priceLists: this.api.getPriceLists(),
      prices:     this.api.getPrices()
    }).subscribe({
      next: ({glassTypes, priceLists, prices}) => {
        this.glassTypesSignal.set(glassTypes);
        this.priceListsSignal.set(priceLists);
        this.pricesSignal.set(prices);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      },
      error: () => {
        this.errorSignal.set('catalog.error.load');
        this.loadingSignal.set(false);
      }
    });
  }

  /** Loads the catalog only once per session. */
  ensureLoaded(): void {
    if (!this.loadedSignal() && !this.loadingSignal()) this.load();
  }

  /** Price per square foot set by the CEO, or null when none is set. */
  priceFor(glassTypeId: number, priceListId: number): number | null {
    return this.priceIndex().get(this.key(glassTypeId, priceListId))?.pricePerSqFt ?? null;
  }

  /** Creates or updates the price of a glass type in a list (CEO only). */
  setPrice(glassTypeId: number, priceListId: number, pricePerSqFt: number): void {
    if (!Number.isFinite(pricePerSqFt) || pricePerSqFt <= 0) {
      this.errorSignal.set('catalog.error.invalid-price');
      return;
    }
    const existing = this.priceIndex().get(this.key(glassTypeId, priceListId));
    const request$ = existing
      ? this.api.updatePrice({...existing, pricePerSqFt})
      : this.api.createPrice({id: 0, glassTypeId, priceListId, pricePerSqFt});
    this.save(request$, saved => this.pricesSignal.update(list =>
      existing ? list.map(p => p.id === saved.id ? saved : p) : [...list, saved]
    ));
  }

  /** Adds a new glass type (CEO only). */
  createGlassType(name: string, thicknessMm: number, color: string): void {
    const cleanName = name.trim();
    if (!cleanName || !Number.isFinite(thicknessMm) || thicknessMm <= 0) {
      this.errorSignal.set('catalog.error.invalid-glass');
      return;
    }
    this.save(
      this.api.createGlassType({id: 0, name: cleanName, thicknessMm, color: color.trim()}),
      saved => this.glassTypesSignal.update(list => [...list, saved])
    );
  }

  /** Adds a new price list, e.g. "Constructora" (CEO only). */
  createPriceList(name: string): void {
    const cleanName = name.trim();
    if (!cleanName) {
      this.errorSignal.set('catalog.error.invalid-list');
      return;
    }
    if (this.priceListsSignal().some(l => l.name.toLowerCase() === cleanName.toLowerCase())) {
      this.errorSignal.set('catalog.error.duplicate-list');
      return;
    }
    this.save(
      this.api.createPriceList({id: 0, name: cleanName}),
      saved => this.priceListsSignal.update(list => [...list, saved])
    );
  }

  clearError(): void { this.errorSignal.set(null); }

  private save<T>(request$: Observable<T>, onSaved: (saved: T) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.pipe(tap(onSaved)).subscribe({
      next: () => this.savingSignal.set(false),
      error: () => {
        this.errorSignal.set('catalog.error.save');
        this.savingSignal.set(false);
      }
    });
  }

  private key(glassTypeId: number, priceListId: number): string {
    return `${glassTypeId}:${priceListId}`;
  }
}
