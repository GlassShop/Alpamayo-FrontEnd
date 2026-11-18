import {GlassType, glassTypeLabel} from '../../../catalog/domain/model/glass-type.entity';
import {MeasureUnit, parseMeasureUnit} from '../model/measure-unit';
import {QuoteLine} from '../model/quote-line.entity';

/** One spreadsheet row, as read from the file (cells are untyped). */
export interface QuoteSheetRow {
  /** 1-based row number in the spreadsheet, for error messages. */
  rowNumber: number;
  glass: unknown;
  width: unknown;
  height: unknown;
  unit: unknown;
  quantity: unknown;
  reference: unknown;
}

/** Why a row could not be imported. Values are translation key suffixes. */
export type RowIssue =
  | 'missing-glass' | 'unknown-glass'
  | 'invalid-width' | 'invalid-height'
  | 'unknown-unit' | 'invalid-quantity';

export interface ParsedLine {
  rowNumber: number;
  line: Omit<QuoteLine, 'id'>;
  /** True when the row had no unit and cm was assumed. */
  unitAssumed: boolean;
}

export interface RejectedRow {
  rowNumber: number;
  issues: RowIssue[];
}

export interface QuoteSheetResult {
  lines: ParsedLine[];
  rejected: RejectedRow[];
}

/**
 * Turns spreadsheet rows into quote lines.
 *
 * @remarks
 * - Glass types are matched by their label ("Laminado 6 mm cielo") or, when it
 *   is unambiguous, by name alone ("Laminado"), ignoring case, accents and spaces.
 * - Numbers may use a comma as decimal separator ("213,5").
 * - A row without unit is read in cm and flagged so the seller can check it.
 * - Completely empty rows are skipped silently.
 * No price is read from the file: prices always come from the CEO's catalog.
 */
export function parseQuoteRows(rows: QuoteSheetRow[], glassTypes: GlassType[]): QuoteSheetResult {
  const byLabel = new Map(glassTypes.map(g => [normalize(glassTypeLabel(g)), g]));
  const byName = new Map<string, GlassType[]>();
  for (const g of glassTypes) {
    const key = normalize(g.name);
    byName.set(key, [...(byName.get(key) ?? []), g]);
  }

  const result: QuoteSheetResult = {lines: [], rejected: []};
  for (const row of rows) {
    if (isEmptyRow(row)) continue;
    const issues: RowIssue[] = [];

    const glassText = text(row.glass);
    let glass: GlassType | undefined;
    if (!glassText) {
      issues.push('missing-glass');
    } else {
      const key = normalize(glassText);
      const sameName = byName.get(key);
      glass = byLabel.get(key) ?? (sameName?.length === 1 ? sameName[0] : undefined);
      if (!glass) issues.push('unknown-glass');
    }

    const width = positiveNumber(row.width);
    if (width === null) issues.push('invalid-width');
    const height = positiveNumber(row.height);
    if (height === null) issues.push('invalid-height');

    const unitText = text(row.unit);
    const unit: MeasureUnit | null = unitText ? parseMeasureUnit(unitText) : 'cm';
    if (unit === null) issues.push('unknown-unit');

    const quantityText = text(row.quantity);
    const quantity = quantityText ? positiveNumber(row.quantity) : 1;
    if (quantity === null || !Number.isInteger(quantity)) issues.push('invalid-quantity');

    if (issues.length > 0 || !glass || width === null || height === null || unit === null || quantity === null) {
      result.rejected.push({rowNumber: row.rowNumber, issues});
      continue;
    }

    const reference = text(row.reference);
    result.lines.push({
      rowNumber: row.rowNumber,
      unitAssumed: !unitText,
      line: {glassTypeId: glass.id, width, height, unit, quantity, ...(reference ? {reference} : {})}
    });
  }
  return result;
}

/** Lower-case, without accents and without any whitespace: "Laminado 6mm Cielo" → "laminado6mmcielo". */
export function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');
}

function text(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}

function positiveNumber(cell: unknown): number | null {
  if (typeof cell === 'number') return Number.isFinite(cell) && cell > 0 ? cell : null;
  const raw = text(cell).replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;
  const value = Number(raw);
  return value > 0 ? value : null;
}

function isEmptyRow(row: QuoteSheetRow): boolean {
  return [row.glass, row.width, row.height, row.unit, row.quantity, row.reference].every(c => text(c) === '');
}
