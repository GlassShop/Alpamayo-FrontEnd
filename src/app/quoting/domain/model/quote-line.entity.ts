import {MeasureUnit} from './measure-unit';

/**
 * One line of a glass quote, as entered by the seller or imported from Excel.
 * Measures are kept in the unit they came in; conversion to cm and rounding
 * happen in the calculator. The catalog price is always read from the CEO's
 * catalog; the seller may only type a final price within the allowed discount.
 */
export interface QuoteLine {
  /** Local identifier, unique within the quote being built. */
  id: number;
  glassTypeId: number;
  width: number | null;
  height: number | null;
  unit: MeasureUnit;
  quantity: number;
  /** Free text to identify the piece, e.g. "Ventana sala". */
  reference?: string;
  /** Final price per square foot typed by the seller; null or missing keeps the catalog price. */
  adjustedPrice?: number | null;
}
