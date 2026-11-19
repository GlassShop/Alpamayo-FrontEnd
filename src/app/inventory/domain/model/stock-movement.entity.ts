import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * COUNT: someone counted the item and typed the real quantity.
 * ADJUSTMENT: units added or removed (breakage, a sale outside the system…).
 * Purchases will add their own kind in the next sprint.
 */
export type MovementKind = 'COUNT' | 'ADJUSTMENT';

/** One change of the stock of an item in a site, written by the server. Never edited or deleted. */
export interface StockMovement extends BaseEntity {
  itemId: number;
  siteId: number;
  kind: MovementKind;
  /** Units added (positive) or removed (negative). */
  delta: number;
  quantityAfter: number;
  reason?: string;
  /** ISO-8601 date-time. */
  at: string;
  by: {id: number; fullName: string};
}
