import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * One change of a product public price, recorded by the server whenever the
 * CEO sets or changes it. Entries are never edited or deleted.
 */
export interface ProductPriceChange extends BaseEntity {
  productId: number;
  /** Name of the product when it changed, e.g. "Serie 62 · 6001 Marco doble corredizo". */
  label: string;
  /** Null when the price was set for the first time. */
  previousPrice: number | null;
  newPrice: number;
  reason?: string;
  /** ISO-8601 date-time. */
  changedAt: string;
  changedBy: {id: number; fullName: string};
}
