/** Short note under a final price: "Rebajado 5 %" or "Subido 3 %". */
export interface PriceNote {
  /** Translation key; it takes `percent`. */
  key: string;
  percent: number;
  /** True for a discount (shown in amber), false for a raise. */
  down: boolean;
}

/** The note for a line whose price was typed by the seller, or null when it keeps the catalog price. */
export function priceNote(view: {adjusted: boolean; discountPercent: number | null}): PriceNote | null {
  if (!view.adjusted || view.discountPercent === null || view.discountPercent === 0) return null;
  const down = view.discountPercent > 0;
  return {key: down ? 'quotes.discounted' : 'quotes.raised', percent: Math.abs(view.discountPercent), down};
}
