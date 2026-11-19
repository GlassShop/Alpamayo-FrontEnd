import {Component, computed, effect, inject, input, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {ProductsStore} from '../../../application/products.store';
import {ProductPriceHistoryStore} from '../../../application/product-price-history.store';
import {Product, ProductCategory, SALE_UNIT} from '../../../domain/model/product.entity';

/** Rows shown at once; the search narrows the list for long categories (accessories, traditional aluminium). */
const PAGE_SIZE = 60;

/**
 * Products of one category with their public price. Read-only in the
 * catalog; on the prices page (`editable`) the CEO types each price and it
 * is saved when the cell is left, with the reason typed on the page.
 */
@Component({
  selector: 'app-product-table',
  imports: [DecimalPipe, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './product-table.html',
  styleUrl: './product-table.css'
})
export class ProductTable {
  readonly products = inject(ProductsStore);
  readonly history = inject(ProductPriceHistoryStore);

  readonly category = input.required<ProductCategory>();
  readonly editable = input(false);
  /** Reason attached to the prices saved while it is filled in (prices page only). */
  readonly reason = input('');

  readonly search = signal('');
  readonly seriesId = signal<number | null>(null);
  readonly onlyMissing = signal(false);
  readonly limit = signal(PAGE_SIZE);

  readonly unitKey = computed(() => `catalog.products.unit.${SALE_UNIT[this.category()]}`);
  readonly isSeries = computed(() => this.category() === 'ALUMINUM_SERIES');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const series = this.seriesId();
    return this.products.byCategory(this.category())
      .filter(p => series === null || p.seriesId === series)
      .filter(p => !this.onlyMissing() || p.publicPrice === null)
      .filter(p => !term || `${p.code} ${p.name} ${p.brand}`.toLowerCase().includes(term));
  });
  readonly rows = computed(() => this.filtered().slice(0, this.limit()));
  readonly missing = computed(() => this.filtered().filter(p => p.publicPrice === null).length);

  constructor() {
    // A new category or filter starts again from the first rows.
    effect(() => {
      this.category(); this.search(); this.seriesId(); this.onlyMissing();
      this.limit.set(PAGE_SIZE);
    });
    effect(() => {
      this.category();
      this.seriesId.set(null);
    });
  }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }

  onSeries(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.seriesId.set(value ? Number(value) : null);
  }

  showMore(): void { this.limit.update(n => n + PAGE_SIZE); }

  details(product: Product): string {
    if (product.category === 'ALUMINUM_SERIES') return this.products.seriesName(product.seriesId);
    return product.brand;
  }

  /** Saves a price when the CEO leaves the cell or presses Enter, only if it changed. */
  onPriceCommit(product: Product, event: Event): void {
    const field = event.target as HTMLInputElement;
    const restore = () => field.value = product.publicPrice === null ? '' : product.publicPrice.toFixed(2);
    if (field.value === '') { restore(); return; }
    const value = Math.round(field.valueAsNumber * 100) / 100;
    if (value === product.publicPrice) return;
    this.products.setPublicPrice(product.id, value, this.reason() || undefined);
    if (!(value > 0)) restore();
  }

  showHistory(productId: number): void {
    this.history.showFor(productId);
    globalThis.document?.getElementById('product-price-history')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
}
