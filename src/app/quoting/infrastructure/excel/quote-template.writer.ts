import {GlassType, glassTypeLabel} from '../../../catalog/domain/model/glass-type.entity';
import {loadExcelJs} from './exceljs-loader';
import {TEMPLATE_COLUMNS} from './quote-sheet-columns';

export const TEMPLATE_FILE_NAME = 'plantilla-cotizacion-alpamayo.xlsx';
const DATA_ROWS = 200;
const RED = 'FFDC2626';

/**
 * Builds the Excel template a customer fills in with their measures.
 *
 * @remarks
 * - Sheet "Medidas": one row per piece, with drop-down lists for the glass
 *   type (current catalog) and the unit (cm, mm, pulg).
 * - Sheet "Instrucciones": how to fill it in, with an example.
 * - Sheet "Vidrios": the list the drop-down reads from.
 * It never contains prices: those always come from the CEO's catalog.
 */
export async function buildQuoteTemplate(glassTypes: GlassType[]): Promise<Blob> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidriería Alpamayo';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Medidas', {views: [{state: 'frozen', ySplit: 1}]});
  sheet.columns = TEMPLATE_COLUMNS.map(c => ({header: c.header, key: c.key, width: c.width}));
  const header = sheet.getRow(1);
  header.font = {bold: true, color: {argb: 'FFFFFFFF'}};
  header.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: RED}};
  header.alignment = {vertical: 'middle'};
  header.height = 22;

  const list = workbook.addWorksheet('Vidrios');
  list.getColumn(1).width = 40;
  list.getCell('A1').value = 'Tipos de vidrio disponibles';
  list.getCell('A1').font = {bold: true};
  const labels = glassTypes.map(glassTypeLabel);
  labels.forEach((label, i) => list.getCell(`A${i + 2}`).value = label);
  const glassRange = `Vidrios!$A$2:$A$${Math.max(2, labels.length + 1)}`;

  for (let r = 2; r <= DATA_ROWS + 1; r++) {
    sheet.getCell(`A${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [glassRange], showErrorMessage: true,
      errorStyle: 'warning', errorTitle: 'Vidrio no reconocido',
      error: 'Elige un vidrio de la lista o escríbelo igual que en la hoja «Vidrios».'
    };
    for (const col of ['B', 'C']) {
      sheet.getCell(`${col}${r}`).dataValidation = {
        type: 'decimal', operator: 'greaterThan', allowBlank: true, formulae: [0],
        showErrorMessage: true, errorTitle: 'Medida inválida', error: 'Escribe un número mayor que cero.'
      };
    }
    sheet.getCell(`D${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"cm,mm,pulg"'], showErrorMessage: true,
      errorTitle: 'Unidad inválida', error: 'Elige cm, mm o pulg.'
    };
    sheet.getCell(`E${r}`).dataValidation = {
      type: 'whole', operator: 'greaterThan', allowBlank: true, formulae: [0],
      showErrorMessage: true, errorTitle: 'Cantidad inválida', error: 'Escribe un número entero mayor que cero.'
    };
  }

  const help = workbook.addWorksheet('Instrucciones');
  help.getColumn(1).width = 100;
  const lines = [
    'Vidriería Alpamayo — Plantilla de medidas',
    '',
    '1. En la hoja «Medidas» escribe una fila por cada pieza de vidrio.',
    '2. Tipo de vidrio: elígelo de la lista desplegable.',
    '3. Ancho y Alto: solo el número (sin «cm» ni comillas).',
    '4. Unidad: elige cm, mm o pulg. Si la dejas vacía se toma en centímetros.',
    '5. Cantidad: número de piezas iguales. Si la dejas vacía se toma 1.',
    '6. Referencia (opcional): dónde va la pieza, por ejemplo «Ventana sala».',
    '7. Guarda el archivo y envíalo a tu vendedora. Ella lo importa y te envía la cotización.',
    '',
    'Ejemplo:  Laminado 6 mm cielo | 213 | 123 | cm | 2 | Ventana sala',
    '',
    'Para cotizar, cada medida se redondea hacia arriba a múltiplos de 5 cm.',
  ];
  lines.forEach((text, i) => help.getCell(`A${i + 1}`).value = text);
  help.getCell('A1').font = {bold: true, size: 14, color: {argb: RED}};

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
