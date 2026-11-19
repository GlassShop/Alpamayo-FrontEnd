/**
 * Cost history of one inventory item, worked out from its costed purchases,
 * and the margin it leaves against the public price.
 *
 * @remarks
 * - Last cost: unit cost of the most recent costed purchase (to decide prices).
 * - Average cost: average of every costed purchase weighted by the units
 *   bought (to value the stock).
 * - Margin on the sale price: (price − cost) / price. A 25 % margin means a
 *   quarter of what the customer pays is left after paying the item.
 * Both prices and costs include IGV, so the margin compares like with like.
 */

import {CM2_PER_SQUARE_FOOT} from '../../../quoting/domain/services/square-foot-calculator';

export interface CostEntry {
  /** Purchase date, YYYY-MM-DD. */
  date: string;
  purchaseId: number;
  quantity: number;
  unitCost: number;
}

export interface CostSummary {
  last: number;
  lastDate: string;
  /** Unit cost of the purchase before the last one, or null when there is only one. */
  previous: number | null;
  /** Change from the previous to the last cost in %, one decimal; null without previous. */
  changePercent: number | null;
  average: number;
  purchases: number;
  unitsBought: number;
}

/** Summary of an item's costs, or null when it has no costed purchase yet. */
export function summarizeCosts(entries: readonly CostEntry[]): CostSummary | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.purchaseId - b.purchaseId);
  const last = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2].unitCost : null;
  return {
    last: last.unitCost,
    lastDate: last.date,
    previous,
    changePercent: previous && previous > 0 ? Math.round(((last.unitCost - previous) / previous) * 1000) / 10 : null,
    average: weightedAverage(sorted),
    purchases: sorted.length,
    unitsBought: sorted.reduce((sum, e) => sum + e.quantity, 0),
  };
}

/** Unit cost averaged over purchases, weighted by the units of each one. */
export function weightedAverage(entries: readonly Pick<CostEntry, 'quantity' | 'unitCost'>[]): number {
  const units = entries.reduce((sum, e) => sum + e.quantity, 0);
  if (units <= 0) throw new RangeError('weighted average needs at least one unit');
  return entries.reduce((sum, e) => sum + e.quantity * e.unitCost, 0) / units;
}

/** Margin on the sale price as a fraction (0.25 = 25 %). Negative when selling below cost. */
export function marginOnPrice(price: number, cost: number): number {
  if (!Number.isFinite(price) || price <= 0) throw new RangeError(`price must be a positive number, got ${price}`);
  return (price - cost) / price;
}

/** Cost of one square foot of a sheet: what the sheet cost divided by its square feet. */
export function costPerSqFt(sheetCost: number, widthCm: number, heightCm: number): number {
  if (!(widthCm > 0 && heightCm > 0)) throw new RangeError('sheet size must be positive');
  return sheetCost / ((widthCm * heightCm) / CM2_PER_SQUARE_FOOT);
}

/** True when a minimum is set and the margin is below it. The minimum is in % (e.g. 20). */
export function isLowMargin(margin: number, minMarginPercent: number | null): boolean {
  return minMarginPercent !== null && margin * 100 < minMarginPercent;
}
