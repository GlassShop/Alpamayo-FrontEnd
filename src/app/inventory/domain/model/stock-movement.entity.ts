import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * COUNT: someone counted the item and typed the real quantity.
 * ADJUSTMENT: units added or removed (breakage, a sale outside the system…).
 * PURCHASE: units that arrived with a registered purchase (written by the server).
 * SALE: units that left with a quote marked as sold (written by the server).
 * SALE_CANCEL: units returned when the CEO annuls that sale (written by the server).
 */
export type MovementKind = 'COUNT' | 'ADJUSTMENT' | 'PURCHASE' | 'SALE' | 'SALE_CANCEL';

/** One change of the stock of an item in a site, written by the server. Never edited or deleted. */
export interface StockMovement extends BaseEntity {
  itemId: number;
  siteId: number;
  kind: MovementKind;
  /** Units added (positive) or removed (negative). */
  delta: number;
  quantityAfter: number;
  reason?: string;
  /** Purchase that brought the units, for PURCHASE movements. */
  purchaseId?: number;
  /** Quote sold (or whose sale was annulled), for SALE and SALE_CANCEL movements. */
  quoteId?: number;
  /** ISO-8601 date-time. */
  at: string;
  by: {id: number; fullName: string};
}
