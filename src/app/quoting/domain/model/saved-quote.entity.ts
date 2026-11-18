import {MeasureUnit} from './measure-unit';
import {DocType} from './document-id';
import {Currency, PaymentMethod} from './payment-method';

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
  pricePerSqFt: number;
  /** Price of one piece. */
  unitPrice: number;
  total: number;
  reference?: string;
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
  extras: SavedExtraLine[];
  total: number;
  subtotal: number;
  igv: number;
  /** total − advance. */
  balance: number;
}

/** Body sent to create or update a quote (the server assigns id, number, seller and dates). */
export type QuoteDraftSnapshot = Omit<SavedQuote, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'seller'>;
