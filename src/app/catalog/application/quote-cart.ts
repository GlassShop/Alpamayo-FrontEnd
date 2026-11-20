import {InjectionToken, Signal} from '@angular/core';

/**
 * What the catalog needs to sell from its pages: add products to the quote
 * being built and show how it is going. The catalog does not know how quotes
 * work; the quoting context provides this token on the catalog route.
 * Without it, the catalog only shows products and prices.
 */
export interface QuoteCart {
  /** Rows on the quote being built (glass, products and extra concepts). */
  rowCount: Signal<number>;
  /** IGV-included total of the quote being built. */
  total: Signal<number>;
  /** Asks for colour and quantity, then adds the product to the quote. */
  addProduct(productId: number): void;
  /** Opens the quoter with this glass type chosen, to type its measures. */
  quoteGlass(glassTypeId: number): void;
  /** Opens the quote being built. */
  open(): void;
}

export const QUOTE_CART = new InjectionToken<QuoteCart>('QUOTE_CART');
