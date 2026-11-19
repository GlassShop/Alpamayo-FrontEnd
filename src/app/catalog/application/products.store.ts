import {computed, inject, Injectable, signal} from '@angular/core';
import {forkJoin, Observable, tap} from 'rxjs';
import {ProductsApi} from '../infrastructure/products-api';
import {Series} from '../domain/model/series.entity';
import {Product, ProductCategory, WeightClass} from '../domain/model/product.entity';

/** Data typed to add a product to the sale catalog (without price). */
export interface NewProduct {
  category: ProductCategory;
  code: string;
  name: string;
  seriesId: number | null;
  brand: string;
  weightClass: WeightClass | null;
}

/**
 * Sale products besides glass — aluminium by series, traditional aluminium,
 * accessories and other sheets — with their public price.
 *
 * @remarks
 * Every price comes from the API; nothing is hard-coded. Anyone may add a
 * product (it starts without price, like a new glass type); only the CEO
 * sets prices. Error values are translation keys.
 */
@Injectable({providedIn: 'root'})
export class ProductsStore {
  private readonly api = inject(ProductsApi);

  private readonly seriesSignal = signal<Series[]>([]);
  private readonly productsSignal = signal<Product[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadedSignal = signal(false);
  private readonly priceSavesSignal = signal(0);

  readonly series = this.seriesSignal.asReadonly();
  readonly products = this.productsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  /** Increases every time a price is saved, so the price history can refresh. */
  readonly priceSaves = this.priceSavesSignal.asReadonly();

  private readonly productIndex = computed(() => new Map(this.productsSignal().map(p => [p.id, p])));
  private readonly seriesIndex = computed(() => new Map(this.seriesSignal().map(s => [s.id, s])));

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({series: this.api.getSeries(), products: this.api.getProducts()}).subscribe({
      next: ({series, products}) => {
        this.seriesSignal.set(series);
        this.productsSignal.set(products);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      },
      error: () => {
        this.errorSignal.set('catalog.products.error.load');
        this.loadingSignal.set(false);
      }
    });
  }

  /** Loads the products only once per session. */
  ensureLoaded(): void {
    if (!this.loadedSignal() && !this.loadingSignal()) this.load();
  }

  product(id: number): Product | undefined { return this.productIndex().get(id); }
  seriesName(id: number | null): string { return id === null ? '' : this.seriesIndex().get(id)?.name ?? ''; }

  /** Products of a category, by series and code (or by name when they have no code). */
  byCategory(category: ProductCategory): Product[] {
    return this.productsSignal()
      .filter(p => p.category === category)
      .sort((a, b) =>
        this.seriesName(a.seriesId).localeCompare(this.seriesName(b.seriesId), 'es', {numeric: true})
        || (a.code || a.name).localeCompare(b.code || b.name, 'es', {numeric: true}));
  }

  /** How many products of a category still have no public price. */
  missingPrices(category: ProductCategory): number {
    return this.productsSignal().filter(p => p.category === category && p.publicPrice === null).length;
  }

  /** Sets the public price of a product (CEO only). */
  setPublicPrice(productId: number, publicPrice: number, reason?: string): void {
    const existing = this.product(productId);
    if (!existing) return;
    if (!Number.isFinite(publicPrice) || publicPrice <= 0) {
      this.errorSignal.set('catalog.products.error.invalid-price');
      return;
    }
    if (existing.publicPrice === publicPrice) return;
    this.save(this.api.setPublicPrice(existing, publicPrice, reason), saved => {
      this.productsSignal.update(list => list.map(p => p.id === saved.id ? saved : p));
      this.priceSavesSignal.update(n => n + 1);
    });
  }

  /** Adds a product without price; the CEO prices it afterwards. */
  createProduct(input: NewProduct): void {
    const name = input.name.trim();
    const code = input.code.trim();
    const needsSeries = input.category === 'ALUMINUM_SERIES';
    if (!name || (needsSeries && input.seriesId === null)) {
      this.errorSignal.set('catalog.products.error.invalid-product');
      return;
    }
    const brand = input.category === 'ACCESSORY' ? input.brand.trim() : '';
    const seriesId = needsSeries ? input.seriesId : null;
    const duplicate = this.productsSignal().some(p => p.category === input.category && p.seriesId === seriesId
      && p.brand.toLowerCase() === brand.toLowerCase()
      && (code ? p.code.toLowerCase() === code.toLowerCase() : !p.code && p.name.toLowerCase() === name.toLowerCase()));
    if (duplicate) {
      this.errorSignal.set('catalog.products.error.duplicate');
      return;
    }
    this.save(this.api.createProduct({
      id: 0, category: input.category, code, name, seriesId, brand,
      weightClass: input.category === 'ALUMINUM_TRADITIONAL' ? input.weightClass : null, publicPrice: null
    }), saved => this.productsSignal.update(list => [...list, saved]));
  }

  clearError(): void { this.errorSignal.set(null); }

  private save<T>(request$: Observable<T>, onSaved: (saved: T) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.pipe(tap(onSaved)).subscribe({
      next: () => this.savingSignal.set(false),
      error: () => {
        this.errorSignal.set('catalog.products.error.save');
        this.savingSignal.set(false);
      }
    });
  }
}
