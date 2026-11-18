import type {Worksheet} from 'exceljs';
import {QuoteSheetRow} from '../../domain/services/quote-sheet-parser';
import {loadExcelJs} from './exceljs-loader';
import {headerKey, SheetColumnKey} from './quote-sheet-columns';

/** Why a file could not be read at all (translation key suffixes). */
export type SheetReadError = 'not-excel' | 'no-header';

export class QuoteSheetReadError extends Error {
  constructor(readonly reason: SheetReadError) { super(reason); }
}

/**
 * Reads the measure rows of an .xlsx file.
 *
 * @remarks
 * Uses the sheet named "Medidas" if present, otherwise the first sheet with a
 * recognisable header row (searched in the first 10 rows), so customers can
 * reorder columns or add their own title rows above the table.
 */
export async function readQuoteSheet(file: Blob): Promise<QuoteSheetRow[]> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new QuoteSheetReadError('not-excel');
  }

  const isMeasures = (name: string) => name.trim().toLowerCase() === 'medidas';
  const sheets = [
    ...workbook.worksheets.filter(s => isMeasures(s.name)),
    ...workbook.worksheets.filter(s => !isMeasures(s.name)),
  ];
  for (const sheet of sheets) {
    const header = findHeader(sheet);
    if (header) return readRows(sheet, header.row, header.columns);
  }
  throw new QuoteSheetReadError('no-header');
}

function findHeader(sheet: Worksheet): {row: number; columns: Map<SheetColumnKey, number>} | null {
  for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
    const columns = new Map<SheetColumnKey, number>();
    sheet.getRow(r).eachCell((cell, col) => {
      const key = headerKey(String(cellValue(cell.value)));
      if (key && !columns.has(key)) columns.set(key, col);
    });
    if (columns.has('glass') && columns.has('width') && columns.has('height')) return {row: r, columns};
  }
  return null;
}

function readRows(sheet: Worksheet, headerRow: number, columns: Map<SheetColumnKey, number>): QuoteSheetRow[] {
  const at = (r: number, key: SheetColumnKey) => {
    const col = columns.get(key);
    return col ? cellValue(sheet.getRow(r).getCell(col).value) : '';
  };
  const rows: QuoteSheetRow[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    rows.push({
      rowNumber: r,
      glass: at(r, 'glass'), width: at(r, 'width'), height: at(r, 'height'),
      unit: at(r, 'unit'), quantity: at(r, 'quantity'), reference: at(r, 'reference'),
    });
  }
  return rows;
}

/** Plain value of an ExcelJS cell: unwraps formulas, rich text and hyperlinks. */
function cellValue(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object') {
    const v = value as Record<string, any>;
    if ('result' in v) return cellValue(v['result']);
    if (Array.isArray(v['richText'])) return v['richText'].map((t: {text: string}) => t.text).join('');
    if ('text' in v) return cellValue(v['text']);
  }
  return String(value);
}
