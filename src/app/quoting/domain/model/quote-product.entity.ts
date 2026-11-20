/**
 * A catalog product on the quote being built (aluminium, accessory, acrylic…),
 * sold in whole bars, units or sheets at its public price.
 */
export interface QuoteProductLine {
  /** Local identifier, unique within the quote being built. */
  id: number;
  productId: number;
  /** Colour chosen from the inventory items of the product; empty when it has none. The price does not depend on it. */
  color: string;
  /** Whole bars, units or sheets. */
  quantity: number;
  /** Final unit price typed by the seller; null keeps the catalog price. */
  adjustedPrice: number | null;
}
