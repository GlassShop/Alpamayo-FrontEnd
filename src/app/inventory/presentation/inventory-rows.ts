import {computed, inject, Injectable} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {ProductsStore} from '../../catalog/application/products.store';
import {glassTypeLabel} from '../../catalog/domain/model/glass-type.entity';
import {productLabel, SALE_UNIT, SaleUnit} from '../../catalog/domain/model/product.entity';
import {CatalogTab} from '../../catalog/presentation/catalog-tabs';
import {InventoryStore} from '../application/inventory.store';
import {InventoryItem, itemSize} from '../domain/model/inventory-item.entity';
import {StockStatus} from '../domain/services/stock-rules';

/** An inventory item ready to show: names from the catalog and stock per site. */
export interface InventoryRow {
  item: InventoryItem;
  category: CatalogTab;
  /** "Laminado 6 mm incoloro" or "6001 Marco doble corredizo". */
  name: string;
  /** Colour and size, e.g. "Negro" or "330 × 214 cm". */
  variant: string;
  /** Glass and other sheets are counted in sheets, aluminium in bars, accessories in pieces. */
  unit: SaleUnit;
  /** Per site, in the order of the sites. */
  stock: {siteId: number; quantity: number | null; status: StockStatus; inTransit: boolean; notes: string}[];
  total: number | null;
  /** Some site is out of stock or at its minimum. */
  toBuy: boolean;
  inTransit: boolean;
  /** Lower-case text the search looks into. */
  searchText: string;
}

/**
 * True when every word typed appears somewhere in the row, in any order:
 * "pestillo negro" finds "Pestillo · Alemar · Negro".
 */
export function matchesSearch(row: Pick<InventoryRow, 'searchText'>, term: string): boolean {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.every(word => row.searchText.includes(word));
}

/**
 * Joins inventory items with the catalog (glass types and products) so the
 * inventory screen and its dialogs show the same names.
 */
@Injectable({providedIn: 'root'})
export class InventoryRows {
  private readonly inventory = inject(InventoryStore);
  private readonly catalog = inject(CatalogStore);
  private readonly products = inject(ProductsStore);

  readonly ready = computed(() => this.inventory.loaded() && this.catalog.loaded() && this.products.loaded());

  readonly rows = computed<InventoryRow[]>(() => {
    if (!this.ready()) return [];
    const glass = new Map(this.catalog.glassTypes().map(g => [g.id, g]));
    const sites = this.inventory.sites();
    return this.inventory.items().map(item => {
      const product = item.productId === null ? undefined : this.products.product(item.productId);
      const glassType = item.glassTypeId === null ? undefined : glass.get(item.glassTypeId);
      const category: CatalogTab = glassType ? 'GLASS' : product?.category ?? 'OTHER';
      const name = glassType ? glassTypeLabel(glassType) : product ? productLabel(product) : `#${item.id}`;
      const series = product?.seriesId ? this.products.seriesName(product.seriesId) : '';
      const variant = [item.color, itemSize(item)].filter(Boolean).join(' · ');
      const stock = sites.map(site => {
        const level = this.inventory.levelFor(item.id, site.id);
        return {
          siteId: site.id, quantity: level?.quantity ?? null, status: this.inventory.statusAt(item.id, site.id),
          inTransit: level?.inTransit ?? false, notes: level?.notes ?? ''
        };
      });
      return {
        item, category, name: series ? `${name} · ${series}` : name, variant,
        unit: product ? SALE_UNIT[product.category] : 'SHEET',
        stock, total: this.inventory.totalQuantity(item.id),
        toBuy: stock.some(s => s.status === 'OUT' || s.status === 'LOW'),
        inTransit: stock.some(s => s.inTransit),
        searchText: `${name} ${series} ${variant} ${item.sku}`.toLowerCase()
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'es', {numeric: true}) || a.variant.localeCompare(b.variant, 'es', {numeric: true}));
  });

  row(itemId: number): InventoryRow | undefined {
    return this.rows().find(r => r.item.id === itemId);
  }

  ensureLoaded(): void {
    this.inventory.ensureLoaded();
    this.catalog.ensureLoaded();
    this.products.ensureLoaded();
  }
}
