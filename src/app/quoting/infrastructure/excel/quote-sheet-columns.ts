import {normalize} from '../../domain/services/quote-sheet-parser';

/** Columns of the customer template, in order. Headers are what the customer sees. */
export const TEMPLATE_COLUMNS = [
  {key: 'glass',     header: 'Tipo de vidrio', width: 34},
  {key: 'width',     header: 'Ancho',          width: 12},
  {key: 'height',    header: 'Alto',           width: 12},
  {key: 'unit',      header: 'Unidad',         width: 12},
  {key: 'quantity',  header: 'Cantidad',       width: 12},
  {key: 'reference', header: 'Referencia',     width: 32},
] as const;

export type SheetColumnKey = typeof TEMPLATE_COLUMNS[number]['key'];

/** Header spellings recognised when reading a file (normalised, letters only). */
const HEADER_ALIASES: Readonly<Record<SheetColumnKey, readonly string[]>> = {
  glass:     ['tipodevidrio', 'vidrio', 'tipo', 'material', 'producto'],
  width:     ['ancho', 'base', 'width'],
  height:    ['alto', 'altura', 'height'],
  unit:      ['unidad', 'unidades', 'unit', 'medida'],
  quantity:  ['cantidad', 'cant', 'piezas', 'quantity', 'qty'],
  reference: ['referencia', 'ref', 'ubicacion', 'descripcion', 'detalle', 'nota'],
};

/** Maps a header cell ("Ancho (cm)", "CANT.") to its column key, or null. */
export function headerKey(raw: string): SheetColumnKey | null {
  const clean = normalize(raw.replace(/\(.*?\)/g, '')).replace(/[^a-z]/g, '');
  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [SheetColumnKey, readonly string[]][]) {
    if (aliases.includes(clean)) return key;
  }
  return null;
}
