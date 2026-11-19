import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {ProductsApi} from '../infrastructure/products-api';
import {ProductPriceChange} from '../domain/model/product-price-change.entity';
import {ProductCategory} from '../domain/model/product.entity';
import {ProductsStore} from './products.store';

/**
 * Public price history of the sale products, for the CEO. Read-only: the
 * server writes it whenever a price is saved.
 */
@Injectable({providedIn: 'root'})
export class ProductPriceHistoryStore {
  private readonly api = inject(ProductsApi);
  private readonly products = inject(ProductsStore);

  private readonly changesSignal = signal<ProductPriceChange[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<'load' | null>(null);
  private readonly loadedSignal = signal(false);

  /** Category whose changes are shown (the tab the CEO is on), or null for all. */
  readonly category = signal<ProductCategory | null>(null);
  /** One product to show, or null for the whole category. */
  readonly productId = signal<number | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /** Newest first, filtered. */
  readonly changes = computed(() => {
    const category = this.category();
    const productId = this.productId();
    return [...this.changesSignal()]
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt) || b.id - a.id)
      .filter(c => productId !== null
        ? c.productId === productId
        : category === null || this.products.product(c.productId)?.category === category);
  });

  readonly isFiltered = computed(() => this.productId() !== null);
  private readonly withHistory = computed(() => new Set(this.changesSignal().map(c => c.productId)));

  constructor() {
    // A saved price creates a history entry on the server: refresh if the history is in use.
    effect(() => {
      this.products.priceSaves();
      if (untracked(() => this.loadedSignal())) untracked(() => this.load());
    });
  }

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPriceHistory().subscribe({
      next: changes => { this.changesSignal.set(changes); this.loadingSignal.set(false); this.loadedSignal.set(true); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  hasHistory(productId: number): boolean { return this.withHistory().has(productId); }

  showFor(productId: number): void { this.productId.set(productId); }

  showCategory(category: ProductCategory | null): void {
    this.category.set(category);
    this.productId.set(null);
  }
}
