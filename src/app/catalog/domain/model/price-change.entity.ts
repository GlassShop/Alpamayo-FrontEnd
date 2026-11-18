import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * One change of a price per square foot, recorded by the server whenever the
 * CEO creates or changes a price. History entries are never edited.
 */
export interface PriceChange extends BaseEntity {
  priceId: number;
  glassTypeId: number;
  priceListId: number;
  /** Null when the price was set for the first time. */
  previousPrice: number | null;
  newPrice: number;
  reason?: string;
  /** ISO-8601 date-time. */
  changedAt: string;
  changedBy: {id: number; fullName: string};
}

/** Percentage change from the previous price, rounded to one decimal; null for a first price. */
export function changePercent(change: Pick<PriceChange, 'previousPrice' | 'newPrice'>): number | null {
  const {previousPrice, newPrice} = change;
  if (previousPrice === null || previousPrice <= 0) return null;
  return Math.round(((newPrice - previousPrice) / previousPrice) * 1000) / 10;
}
