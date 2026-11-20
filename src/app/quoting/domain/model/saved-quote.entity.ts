import {MeasureUnit} from './measure-unit';
import {DocType} from './document-id';
import {Currency, PaymentMethod} from './payment-method';
import {SaleUnit} from '../../../catalog/domain/model/product.entity';

export interface QuoteCustomer {
  docType: DocType;
  docNumber: string;
  name: string;
  phone?: string;
  address?: string;
}

/** A glass line frozen at the moment the quote was saved. */
export interface SavedGlassLine {
  glassTypeId: number;
  description: string;
  width: number;
  height: number;
  unit: MeasureUnit;
  billedWidthCm: number;
  billedHeightCm: number;
  quantity: number;
  squareFeet: number;
  /** Final price per square foot charged to the customer. */
  pricePerSqFt: number;
  /** Price per square foot of the catalog when it was saved; missing in quotes saved before discounts existed (same as pricePerSqFt). */
  catalogPricePerSqFt?: number;
  /** Price of one piece. */
  unitPrice: number;
  total: number;
  reference?: string;
}

/** A catalog product frozen at the moment the quote was saved. */
export interface SavedProductLine {
  productId: number;
  /** "6001 Marco doble corredizo" — code, name and brand as they were. */
  description: string;
  color: string;
  saleUnit: SaleUnit;
  quantity: number;
  /** Public price when it was saved. */
  catalogUnitPrice: number;
  /** Final unit price charged to the customer. */
  unitPrice: number;
  total: number;
}

/** An additional concept frozen at the moment the quote was saved. */
export interface SavedExtraLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Everything the seller fills in when saving. */
export interface QuoteDetails {
  customer: QuoteCustomer;
  paymentMethod: PaymentMethod;
  advance: number;
  termsAccepted: boolean;
  notes?: string;
}

/**
 * A saved quote. Prices and totals are a snapshot: what was promised to the
 * customer does not change if the CEO changes prices later.
 */
export interface SavedQuote extends QuoteDetails {
  id: number;
  /** "COT-000001", assigned by the server. */
  number: string;
  createdAt: string;
  updatedAt: string;
  seller: {id: number; fullName: string};
  priceList: {id: number; name: string};
  currency: Currency;
  lines: SavedGlassLine[];
  /** Empty in quotes saved before products could be quoted. */
  products: SavedProductLine[];
  extras: SavedExtraLine[];
  total: number;
  subtotal: number;
  igv: number;
  /** total − advance. */
  balance: number;
}

/** Body sent to create or update a quote (the server assigns id, number, seller and dates). */
export type QuoteDraftSnapshot = Omit<SavedQuote, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'seller'>;

/**
 * Amount taken off the catalog prices, in soles (0 when nothing was lowered).
 * Raised prices do not offset discounts on other lines.
 */
export function quoteDiscount(quote: Pick<SavedQuote, 'lines' | 'products'>): number {
  const glass = quote.lines.reduce((acc, l) => {
    // The total is proportional to the price per ft²; rounded square feet would lose a few cents.
    const catalogTotal = Math.round(l.total * (l.catalogPricePerSqFt ?? l.pricePerSqFt) / l.pricePerSqFt * 100) / 100;
    return acc + Math.max(0, catalogTotal - l.total);
  }, 0);
  const products = (quote.products ?? []).reduce((acc, p) => acc + Math.max(0, (p.catalogUnitPrice - p.unitPrice) * p.quantity), 0);
  return Math.round((glass + products) * 100) / 100;
}
