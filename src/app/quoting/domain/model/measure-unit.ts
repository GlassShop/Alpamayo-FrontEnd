/** Units customers use to send glass measures. Billing always happens in cm. */
export type MeasureUnit = 'cm' | 'mm' | 'in';

export const MEASURE_UNITS: readonly MeasureUnit[] = ['cm', 'mm', 'in'];

/** Centimetres in one unit. */
export const CM_PER_UNIT: Readonly<Record<MeasureUnit, number>> = {cm: 1, mm: 0.1, in: 2.54};

/** Short label shown to users. */
export const UNIT_LABEL: Readonly<Record<MeasureUnit, string>> = {cm: 'cm', mm: 'mm', in: 'pulg'};

/** Spellings accepted when importing a spreadsheet (compared after normalising). */
const UNIT_ALIASES: Readonly<Record<string, MeasureUnit>> = {
  'cm': 'cm', 'cms': 'cm', 'centimetro': 'cm', 'centimetros': 'cm',
  'mm': 'mm', 'milimetro': 'mm', 'milimetros': 'mm',
  'in': 'in', 'inch': 'in', 'inches': 'in', 'pulg': 'in', 'pulgada': 'in', 'pulgadas': 'in', '"': 'in', '\'\'': 'in'
};

/** Parses a unit typed by a customer ("Pulgadas", "MM", "\""), or null if unknown. */
export function parseMeasureUnit(raw: string): MeasureUnit | null {
  const key = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\.$/, '');
  return UNIT_ALIASES[key] ?? null;
}
