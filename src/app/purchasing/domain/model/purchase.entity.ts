import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {Money} from '../services/landed-cost';

/** PENDING_COST: the goods arrived and were added to the stock; the CEO still has to type the costs. */
export type PurchaseStatus = 'PENDING_COST' | 'COSTED';

export interface PurchaseLine {
  itemId: number;
  /** Units received (sheets, bars, pieces). */
  quantity: number;
  /** Packs typed when it arrived (e.g. 3 crates), only for reference; null when typed in units. */
  packs: number | null;
  /** Price of one unit in US dollars. CEO only: null for other roles and until it is costed. */
  unitPriceUsd: number | null;
  /** Landed cost of one unit in soles, worked out by the server. CEO only. */
  unitCost: number | null;
}

/** What the CEO types to cost a purchase. Null for other roles and until it is costed. */
export interface PurchaseCosts {
  exchangeRate: number;
  freight: Money;
  /** Lima → Huaraz transport. */
  transport: Money;
}

/**
 * Goods that arrived at one site. Warehouse staff and sellers register the
 * arrival (what and how many); the stock goes up at once. The CEO then types
 * the dollars, exchange rate, freight and transport, and the server works out
 * the landed cost of each unit. Amounts never reach other roles.
 */
export interface Purchase extends BaseEntity {
  /** YYYY-MM-DD. */
  date: string;
  supplier: string;
  siteId: number;
  lines: PurchaseLine[];
  status: PurchaseStatus;
  costs: PurchaseCosts | null;
  notes: string;
  createdBy: {id: number; fullName: string};
  createdAt: string;
  costedBy: {id: number; fullName: string} | null;
  costedAt: string | null;
}

/** Units of every line. */
export function purchaseUnits(purchase: Pick<Purchase, 'lines'>): number {
  return purchase.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Total landed cost in soles, or null when it is not costed (or the costs are not visible). */
export function purchaseTotal(purchase: Pick<Purchase, 'lines'>): number | null {
  if (purchase.lines.some(line => line.unitCost === null)) return null;
  return purchase.lines.reduce((sum, line) => sum + line.quantity * (line.unitCost ?? 0), 0);
}
