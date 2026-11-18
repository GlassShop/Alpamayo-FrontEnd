import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {PriceHistoryApi} from '../infrastructure/price-history-api';
import {PriceChange} from '../domain/model/price-change.entity';
import {CatalogStore} from './catalog.store';

/**
 * Price history for the CEO: every price change with who, when, the
 * previous and new value and the optional reason. Read-only: the server
 * writes the history whenever a price is saved.
 */
@Injectable({providedIn: 'root'})
export class PriceHistoryStore {
  private readonly api = inject(PriceHistoryApi);
  private readonly catalog = inject(CatalogStore);

  private readonly changesSignal = signal<PriceChange[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<'load' | null>(null);
  private readonly loadedSignal = signal(false);

  /** Glass type / price list to filter by, or null for all. */
  readonly glassTypeId = signal<number | null>(null);
  readonly priceListId = signal<number | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /** Newest first, filtered. */
  readonly changes = computed(() => {
    const glass = this.glassTypeId();
    const list = this.priceListId();
    return [...this.changesSignal()]
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt) || b.id - a.id)
      .filter(c => (glass === null || c.glassTypeId === glass) && (list === null || c.priceListId === list));
  });

  readonly isFiltered = computed(() => this.glassTypeId() !== null || this.priceListId() !== null);

  /** "glassTypeId:priceListId" pairs that have at least one change. */
  private readonly withHistory = computed(() => new Set(this.changesSignal().map(c => `${c.glassTypeId}:${c.priceListId}`)));

  constructor() {
    // A saved price creates a history entry on the server: refresh if the history is in use.
    effect(() => {
      this.catalog.priceSaves();
      if (untracked(() => this.loadedSignal())) untracked(() => this.load());
    });
  }

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll().subscribe({
      next: changes => { this.changesSignal.set(changes); this.loadingSignal.set(false); this.loadedSignal.set(true); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  hasHistory(glassTypeId: number, priceListId: number): boolean {
    return this.withHistory().has(`${glassTypeId}:${priceListId}`);
  }

  /** Shows only the history of one glass type in one price list. */
  showFor(glassTypeId: number, priceListId: number): void {
    this.glassTypeId.set(glassTypeId);
    this.priceListId.set(priceListId);
  }

  showAll(): void {
    this.glassTypeId.set(null);
    this.priceListId.set(null);
  }
}
