import {computed, inject, Injectable} from '@angular/core';
import {InventoryCosts, ItemCost} from '../../inventory/application/inventory-costs';
import {CostAnalysisStore} from '../application/cost-analysis.store';
import {PurchasesStore} from '../application/purchases.store';
import {CostSummary} from './components/cost-summary/cost-summary';

/**
 * Gives the inventory the cost of each item from the costed purchases, so
 * the CEO sees cost and margin in the stock table itself.
 */
@Injectable()
export class InventoryCostsAdapter implements InventoryCosts {
  private readonly costs = inject(CostAnalysisStore);
  private readonly purchases = inject(PurchasesStore);

  readonly ready = computed(() => this.purchases.loaded());
  readonly summary = CostSummary;

  ensureLoaded(): void {
    this.purchases.ensureLoaded();
    this.costs.loadSettings();
  }

  costOf(itemId: number): ItemCost | null {
    const analysis = this.costs.itemAnalysis(itemId);
    if (!analysis) return null;
    const s = analysis.summary;
    return {
      last: s?.last ?? null,
      changePercent: s?.changePercent ?? null,
      average: s?.average ?? null,
      salePrice: analysis.salePrice,
      costPerSqFt: analysis.perSqFt ? analysis.comparableCost : null,
      margin: analysis.margin,
      lowMargin: analysis.lowMargin
    };
  }
}
