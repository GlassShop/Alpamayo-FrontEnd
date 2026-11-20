/**
 * Rule for the final price a seller may type on a quote line.
 *
 * @remarks
 * Raising the price is always allowed (special cut, urgent order…). Lowering
 * it is allowed down to the maximum discount the CEO sets; while the CEO has
 * not set one, the maximum is 0 % and sellers cannot lower prices. Whoever
 * manages prices (the CEO) has no limit. Prices are IGV included.
 */

/** Lowest final price allowed for a catalog price and a maximum discount in %, rounded up to the cent. */
export function minAllowedPrice(catalogPrice: number, maxDiscountPercent: number | null): number {
  const percent = maxDiscountPercent ?? 0;
  // catalogPrice × (100 − %) is the price in cents; the tolerance absorbs floating-point noise (85 × 90 = 7650).
  return Math.ceil(catalogPrice * (100 - percent) - 1e-6) / 100;
}

/** True when the final price respects the limit (or the user has none). */
export function isAllowedPrice(catalogPrice: number, finalPrice: number, maxDiscountPercent: number | null, unlimited: boolean): boolean {
  if (!(finalPrice > 0)) return false;
  if (unlimited || finalPrice >= catalogPrice) return true;
  return finalPrice >= minAllowedPrice(catalogPrice, maxDiscountPercent);
}

/** Discount against the catalog price in %, rounded to one decimal; negative when the price was raised. */
export function discountPercent(catalogPrice: number, finalPrice: number): number {
  if (!(catalogPrice > 0)) return 0;
  const tenths = (catalogPrice - finalPrice) / catalogPrice * 1000;
  // Half away from zero, so a raise of 6.25 % reads −6.3 like a discount of 6.25 % reads 6.3.
  return Math.sign(tenths) * Math.round(Math.abs(tenths)) / 10;
}
