import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * Quantity of one item in one site. It only changes through stock movements
 * (counts and adjustments), so every change has an author and a reason.
 */
export interface StockLevel extends BaseEntity {
  itemId: number;
  siteId: number;
  /** Null while the item has never been counted in the site (it may still be "en camino" or have notes). */
  quantity: number | null;
  /** Marked by hand while an order is on its way. */
  inTransit: boolean;
  notes: string;
}
