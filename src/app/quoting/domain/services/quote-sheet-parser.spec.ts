import {GlassType} from '../../../catalog/domain/model/glass-type.entity';
import {parseQuoteRows, QuoteSheetRow} from './quote-sheet-parser';

const glassTypes: GlassType[] = [
  {id: 1, name: 'Laminado', thicknessMm: 6, color: 'cielo'},
  {id: 2, name: 'Espejo doble', thicknessMm: 4, color: 'plateado'},
  {id: 3, name: 'Templado', thicknessMm: 8, color: 'incoloro'},
  {id: 4, name: 'Templado', thicknessMm: 10, color: 'incoloro'},
];

let n = 1;
const row = (cells: Partial<Omit<QuoteSheetRow, 'rowNumber'>>): QuoteSheetRow =>
  ({rowNumber: ++n, glass: '', width: '', height: '', unit: '', quantity: '', reference: '', ...cells});

describe('parseQuoteRows', () => {
  beforeEach(() => n = 1);

  it('imports valid rows with their unit, quantity and reference', () => {
    const {lines, rejected} = parseQuoteRows([
      row({glass: 'Laminado 6 mm cielo', width: 2130, height: 1230, unit: 'mm', quantity: 2, reference: 'Ventana sala'}),
      row({glass: 'Espejo doble 4 mm plateado', width: '120', height: '60', unit: 'cm', quantity: '1'}),
    ], glassTypes);
    expect(rejected).toEqual([]);
    expect(lines.map(l => l.line)).toEqual([
      {glassTypeId: 1, width: 2130, height: 1230, unit: 'mm', quantity: 2, reference: 'Ventana sala'},
      {glassTypeId: 2, width: 120, height: 60, unit: 'cm', quantity: 1},
    ]);
  });

  it('matches glass types ignoring case, accents and spaces, or by unambiguous name', () => {
    const {lines} = parseQuoteRows([
      row({glass: 'LAMINADO 6MM CIELO', width: 100, height: 100}),
      row({glass: 'espejo doble', width: 100, height: 100}),
    ], glassTypes);
    expect(lines.map(l => l.line.glassTypeId)).toEqual([1, 2]);
  });

  it('rejects an ambiguous name that matches several glass types', () => {
    const {lines, rejected} = parseQuoteRows([row({glass: 'Templado', width: 100, height: 100})], glassTypes);
    expect(lines).toEqual([]);
    expect(rejected).toEqual([{rowNumber: 2, issues: ['unknown-glass']}]);
  });

  it('accepts unit spellings, comma decimals and defaults', () => {
    const {lines} = parseQuoteRows([
      row({glass: 'Laminado', width: '84', height: '48,5', unit: 'Pulgadas'}),
      row({glass: 'Laminado', width: 213, height: 123}),
    ], glassTypes);
    expect(lines[0].line).toMatchObject({width: 84, height: 48.5, unit: 'in', quantity: 1});
    expect(lines[0].unitAssumed).toBe(false);
    expect(lines[1].line.unit).toBe('cm');
    expect(lines[1].unitAssumed).toBe(true);
  });

  it('reports every problem of a row with its row number', () => {
    const {lines, rejected} = parseQuoteRows([
      row({glass: 'Vidrio inventado', width: 0, height: 'abc', unit: 'metros', quantity: 1.5}),
      row({glass: '', width: 100, height: 100}),
    ], glassTypes);
    expect(lines).toEqual([]);
    expect(rejected).toEqual([
      {rowNumber: 2, issues: ['unknown-glass', 'invalid-width', 'invalid-height', 'unknown-unit', 'invalid-quantity']},
      {rowNumber: 3, issues: ['missing-glass']},
    ]);
  });

  it('skips completely empty rows', () => {
    const {lines, rejected} = parseQuoteRows([row({}), row({glass: 'Laminado', width: 10, height: 10})], glassTypes);
    expect(lines.length).toBe(1);
    expect(rejected).toEqual([]);
  });
});
