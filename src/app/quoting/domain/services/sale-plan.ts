import {SaleLine, SavedProductLine} from '../model/saved-quote.entity';

/** What the sale needs to know of an inventory item. */
export interface StockItemRef {
  id: number;
  productId: number | null;
  color: string;
}

/**
 * Why a product line cannot leave the chosen site yet:
 * - no-item: the product in that colour is not in the inventory;
 * - choose-item: several items fit (e.g. sheets of different sizes) and none was chosen;
 * - not-counted: the item was never counted in the site;
 * - not-enough: the site has fewer units than the quote sells.
 */
export type SaleLineProblem = 'no-item' | 'choose-item' | 'not-counted' | 'not-enough';

/** One product line of the quote and the inventory item it takes units from. */
export interface SalePlanLine {
  productIndex: number;
  product: SavedProductLine;
  /** Items of the product in the line's colour. */
  candidates: StockItemRef[];
  itemId: number | null;
  /** Units in the site now; null while unknown or never counted. */
  before: number | null;
  /** Units left after the sale (counting every line that takes from the same item). */
  after: number | null;
  problem: SaleLineProblem | null;
}

/**
 * Works out which inventory item every product line takes units from in a
 * site, and whether the site has enough. Glass and extra concepts never touch
 * the stock. Stock never goes negative: any problem blocks the whole sale.
 *
 * @param chosen item picked by the user for lines with several candidates, by product index
 */
export function planSale(
  products: readonly SavedProductLine[], siteId: number, items: readonly StockItemRef[],
  quantityAt: (itemId: number, siteId: number) => number | null, chosen: ReadonlyMap<number, number> = new Map(),
): SalePlanLine[] {
  const resolved = products.map((product, productIndex) => {
    const candidates = items.filter(i => i.productId === product.productId && sameText(i.color, product.color));
    const pick = candidates.length === 1 ? candidates[0].id
      : candidates.some(c => c.id === chosen.get(productIndex)) ? chosen.get(productIndex)! : null;
    return {productIndex, product, candidates, itemId: pick};
  });
  // Two lines may take from the same item: the site must hold the sum.
  const needed = new Map<number, number>();
  for (const r of resolved) if (r.itemId !== null) needed.set(r.itemId, (needed.get(r.itemId) ?? 0) + r.product.quantity);

  return resolved.map(r => {
    if (r.candidates.length === 0) return {...r, before: null, after: null, problem: 'no-item'};
    if (r.itemId === null) return {...r, before: null, after: null, problem: 'choose-item'};
    const before = quantityAt(r.itemId, siteId);
    if (before === null) return {...r, before, after: null, problem: 'not-counted'};
    const after = before - needed.get(r.itemId)!;
    return {...r, before, after, problem: after < 0 ? 'not-enough' : null};
  });
}

/** True when every product line can leave the site (a quote without products can always be sold). */
export function canSell(plan: readonly SalePlanLine[]): boolean {
  return plan.every(line => line.problem === null);
}

/** The lines sent to the server once the plan has no problems. */
export function toSaleLines(plan: readonly SalePlanLine[]): SaleLine[] {
  return plan.map(line => ({productIndex: line.productIndex, itemId: line.itemId!, quantity: line.product.quantity}));
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
