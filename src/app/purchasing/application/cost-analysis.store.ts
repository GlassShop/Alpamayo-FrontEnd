import {computed, inject, Injectable, signal} from '@angular/core';
import {PurchasesApi} from '../infrastructure/purchases-api';
import {PurchasesStore} from './purchases.store';
import {InventoryStore} from '../../inventory/application/inventory.store';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {ProductsStore} from '../../catalog/application/products.store';
import {CostEntry, costPerSqFt, CostSummary, isLowMargin, marginOnPrice, summarizeCosts} from '../domain/services/item-costs';

/** Cost and margin of one inventory item, for the CEO. */
export interface ItemCostAnalysis {
  itemId: number;
  summary: CostSummary | null;
  /** Public price compared with the cost: per unit, or per square foot for glass. Null when not set. */
  salePrice: number | null;
  /** Last cost on the same basis as the sale price (per square foot for glass). */
  comparableCost: number | null;
  /** Margin on the sale price (0.25 = 25 %), or null when price or cost is missing. */
  margin: number | null;
  lowMargin: boolean;
  /** Glass is compared per square foot; everything else per unit. */
  perSqFt: boolean;
}

export interface SiteValue {
  siteId: number;
  /** Units in stock × average cost. */
  value: number;
  /** Items with stock in the site but no costed purchase yet (not in the value). */
  withoutCost: number;
}

/** "Pública" without accents or case, to find the public price list of glass. */
const PUBLIC_LIST = 'publica';
const plain = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

/**
 * CEO's view of costs: last, previous and average cost of each item from its
 * costed purchases, the margin it leaves against the public price, the
 * minimum margin that triggers a warning and the value of the stock per site.
 */
@Injectable({providedIn: 'root'})
export class CostAnalysisStore {
  private readonly api = inject(PurchasesApi);
  private readonly purchases = inject(PurchasesStore);
  private readonly inventory = inject(InventoryStore);
  private readonly catalog = inject(CatalogStore);
  private readonly products = inject(ProductsStore);

  private readonly minMarginSignal = signal<number | null>(null);
  private readonly settingsErrorSignal = signal<string | null>(null);
  private readonly savingSignal = signal(false);

  /** Minimum margin in % (e.g. 20); null keeps the warning off. */
  readonly minMarginPercent = this.minMarginSignal.asReadonly();
  readonly settingsError = this.settingsErrorSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();

  /** Costed purchase lines of each item. */
  private readonly entriesByItem = computed(() => {
    const map = new Map<number, CostEntry[]>();
    for (const purchase of this.purchases.purchases()) {
      if (purchase.status !== 'COSTED') continue;
      for (const line of purchase.lines) {
        if (line.unitCost === null) continue;
        const list = map.get(line.itemId) ?? [];
        list.push({date: purchase.date, purchaseId: purchase.id, quantity: line.quantity, unitCost: line.unitCost});
        map.set(line.itemId, list);
      }
    }
    return map;
  });

  private readonly publicListId = computed(() => {
    const lists = this.catalog.priceLists();
    return lists.find(l => plain(l.name) === PUBLIC_LIST)?.id ?? lists[0]?.id ?? null;
  });

  readonly analysis = computed(() => {
    const min = this.minMarginSignal();
    const entries = this.entriesByItem();
    const listId = this.publicListId();
    return new Map(this.inventory.items().map(item => {
      const summary = summarizeCosts(entries.get(item.id) ?? []);
      const perSqFt = item.glassTypeId !== null;
      let salePrice: number | null = null;
      let comparableCost: number | null = summary?.last ?? null;
      if (perSqFt) {
        salePrice = listId === null ? null : this.catalog.priceFor(item.glassTypeId!, listId);
        comparableCost = summary && item.widthCm && item.heightCm ? costPerSqFt(summary.last, item.widthCm, item.heightCm) : null;
      } else if (item.productId !== null) {
        salePrice = this.products.product(item.productId)?.publicPrice ?? null;
      }
      const margin = salePrice !== null && comparableCost !== null ? marginOnPrice(salePrice, comparableCost) : null;
      const result: ItemCostAnalysis = {
        itemId: item.id, summary, salePrice, comparableCost, margin, perSqFt,
        lowMargin: margin !== null && isLowMargin(margin, min)
      };
      return [item.id, result] as const;
    }));
  });

  readonly lowMarginCount = computed(() => [...this.analysis().values()].filter(a => a.lowMargin).length);

  /** Value of the stock in each site at average cost. */
  readonly siteValues = computed<SiteValue[]>(() => {
    const analysis = this.analysis();
    return this.inventory.sites().map(site => {
      let value = 0;
      let withoutCost = 0;
      for (const item of this.inventory.items()) {
        const quantity = this.inventory.quantityAt(item.id, site.id);
        if (!quantity) continue;
        const average = analysis.get(item.id)?.summary?.average;
        if (average === undefined) withoutCost++;
        else value += quantity * average;
      }
      return {siteId: site.id, value, withoutCost};
    });
  });

  itemAnalysis(itemId: number): ItemCostAnalysis | undefined { return this.analysis().get(itemId); }

  loadSettings(): void {
    this.settingsErrorSignal.set(null);
    this.api.getSettings().subscribe({
      next: s => this.minMarginSignal.set(s.minMarginPercent),
      error: () => this.settingsErrorSignal.set('costs.error.settings-load')
    });
  }

  /** Sets the minimum margin in % (0 to 100), or null to turn the warning off. */
  setMinMargin(percent: number | null): void {
    if (percent !== null && !(Number.isFinite(percent) && percent >= 0 && percent <= 100)) {
      this.settingsErrorSignal.set('costs.error.invalid-margin');
      return;
    }
    if (percent === this.minMarginSignal()) return;
    this.savingSignal.set(true);
    this.settingsErrorSignal.set(null);
    this.api.setMinMargin(percent).subscribe({
      next: s => { this.minMarginSignal.set(s.minMarginPercent); this.savingSignal.set(false); },
      error: () => { this.settingsErrorSignal.set('costs.error.settings-save'); this.savingSignal.set(false); }
    });
  }
}
