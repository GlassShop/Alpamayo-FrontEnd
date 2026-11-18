import {GlassType} from '../../../catalog/domain/model/glass-type.entity';
import {parseQuoteRows} from '../../domain/services/quote-sheet-parser';
import {loadExcelJs} from './exceljs-loader';
import {buildQuoteTemplate} from './quote-template.writer';
import {QuoteSheetReadError, readQuoteSheet} from './quote-sheet.reader';
import {headerKey} from './quote-sheet-columns';

const glassTypes: GlassType[] = [
  {id: 1, name: 'Laminado', thicknessMm: 6, color: 'cielo'},
  {id: 2, name: 'Espejo doble', thicknessMm: 4, color: 'plateado'},
];

/** Simulates a customer opening the template, filling rows and saving it. */
async function fillTemplate(rows: unknown[][]): Promise<Blob> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await (await buildQuoteTemplate(glassTypes)).arrayBuffer());
  const sheet = workbook.getWorksheet('Medidas')!;
  rows.forEach((values, i) => sheet.getRow(i + 2).values = values as any[]);
  return new Blob([await workbook.xlsx.writeBuffer()]);
}

describe('Excel template and reader', () => {
  it('builds a template with the measures, glass list and instructions sheets and no prices', async () => {
    const ExcelJS = await loadExcelJs();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await (await buildQuoteTemplate(glassTypes)).arrayBuffer());
    expect(workbook.worksheets.map(s => s.name)).toEqual(['Medidas', 'Vidrios', 'Instrucciones']);
    expect(workbook.getWorksheet('Medidas')!.getRow(1).values).toEqual(
      [undefined, 'Tipo de vidrio', 'Ancho', 'Alto', 'Unidad', 'Cantidad', 'Referencia']);
    expect(workbook.getWorksheet('Vidrios')!.getCell('A2').value).toBe('Laminado 6 mm cielo');
    expect(workbook.getWorksheet('Medidas')!.getCell('A2').dataValidation?.type).toBe('list');
    const allText = workbook.worksheets.flatMap(s => s.getSheetValues().flat()).join(' ');
    expect(allText).not.toMatch(/S\/|precio/i);
  });

  it('reads back what the customer filled in, ready to import', async () => {
    const file = await fillTemplate([
      ['Laminado 6 mm cielo', 2130, 1230, 'mm', 2, 'Ventana sala'],
      ['Espejo doble 4 mm plateado', 120, 60, 'cm', 1],
      [],
      ['Vidrio inventado', 100, 100, 'cm', 1],
    ]);
    const rows = await readQuoteSheet(file);
    const {lines, rejected} = parseQuoteRows(rows, glassTypes);
    expect(lines.map(l => l.line)).toEqual([
      {glassTypeId: 1, width: 2130, height: 1230, unit: 'mm', quantity: 2, reference: 'Ventana sala'},
      {glassTypeId: 2, width: 120, height: 60, unit: 'cm', quantity: 1},
    ]);
    expect(rejected).toEqual([{rowNumber: 5, issues: ['unknown-glass']}]);
  });

  it('finds the header even with title rows above and columns in another order', async () => {
    const ExcelJS = await loadExcelJs();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pedido cliente');
    sheet.addRow(['Obra: Edificio Huaraz']);
    sheet.addRow([]);
    sheet.addRow(['Cant.', 'Alto (cm)', 'Ancho (cm)', 'Vidrio']);
    sheet.addRow([3, 60, 120, 'espejo doble']);
    const rows = await readQuoteSheet(new Blob([await workbook.xlsx.writeBuffer()]));
    const {lines} = parseQuoteRows(rows, glassTypes);
    expect(lines.map(l => l.line)).toEqual([{glassTypeId: 2, width: 120, height: 60, unit: 'cm', quantity: 3}]);
  });

  it('explains when the file is not an Excel workbook or has no measures table', async () => {
    await expect(readQuoteSheet(new Blob(['hola']))).rejects.toEqual(new QuoteSheetReadError('not-excel'));
    const ExcelJS = await loadExcelJs();
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Hoja1').addRow(['Nombre', 'Teléfono']);
    await expect(readQuoteSheet(new Blob([await workbook.xlsx.writeBuffer()])))
      .rejects.toEqual(new QuoteSheetReadError('no-header'));
  });

  it('recognises common header spellings', () => {
    expect(headerKey('Tipo de Vidrio')).toBe('glass');
    expect(headerKey('ANCHO (mm)')).toBe('width');
    expect(headerKey('Cant.')).toBe('quantity');
    expect(headerKey('Ubicación')).toBe('reference');
    expect(headerKey('Teléfono')).toBeNull();
  });
});
