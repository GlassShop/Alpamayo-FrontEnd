import {MeasureUnit} from './measure-unit';

/**
 * One line of a glass quote, as entered by the seller or imported from Excel.
 * Measures are kept in the unit they came in; conversion to cm and rounding
 * happen in the calculator. The line never stores a price: it is always read
 * from the CEO's catalog.
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
}
