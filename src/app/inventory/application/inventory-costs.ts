import {InjectionToken, Signal, Type} from '@angular/core';

/** Cost of one item as the CEO sees it in the stock table. */
export interface ItemCost {
  /** Last unit cost, or null before its first costed purchase. */
  last: number | null;
  /** Change of the last cost against the previous one, in % (null with a single purchase). */
  changePercent: number | null;
  /** Weighted average unit cost of its costed purchases. */
  average: number | null;
  /** Public price, per unit or per square foot for glass (same basis as the margin). */
  salePrice: number | null;
  /** Last cost per square foot for glass; null for the rest. */
  costPerSqFt: number | null;
  /** Margin on the public price (0.25 = 25 %), or null without price or cost. */
  margin: number | null;
  lowMargin: boolean;
}

/**
 * What the inventory needs to show costs to the CEO. Inventory does not know
 * how costs are worked out: the purchasing context provides this token on the
 * inventory routes. Without it, the stock table shows no amounts.
 */
export interface InventoryCosts {
  /** Loads what the costs need (purchases, minimum margin). */
  ensureLoaded(): void;
  ready: Signal<boolean>;
  costOf(itemId: number): ItemCost | null;
  /** Shown above the stock table: stock value per site and the minimum margin. */
  summary: Type<unknown>;
}

export const INVENTORY_COSTS = new InjectionToken<InventoryCosts>('INVENTORY_COSTS');
