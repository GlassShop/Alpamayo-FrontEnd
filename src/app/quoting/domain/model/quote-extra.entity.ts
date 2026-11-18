/**
 * Additional concept on a quote that is not in the glass catalog
 * (installation, transport, accessories…). Its price is typed by the seller.
 */
export interface QuoteExtra {
  /** Local identifier, unique within the quote being built. */
  id: number;
  description: string;
  quantity: number;
  /** Unit price in soles, IGV included. */
  unitPrice: number | null;
}
