import {cleanDocNumber, docTypeOf, isValidDni, isValidDocument, isValidRuc, rucCheckDigit} from './document-id';

describe('document-id', () => {
  it('accepts a DNI of exactly 8 digits', () => {
    expect(isValidDni('43210987')).toBe(true);
    expect(isValidDni('4321098')).toBe(false);
    expect(isValidDni('4321098A')).toBe(false);
  });

  it('validates the RUC check digit (SUNAT modulo 11)', () => {
    // 20131312955 is SUNAT's own RUC
    expect(rucCheckDigit('2013131295')).toBe(5);
    expect(isValidRuc('20131312955')).toBe(true);
    expect(isValidRuc('20131312954')).toBe(false);
  });

  it('accepts the RUC prefixes SUNAT assigns and rejects others', () => {
    for (const prefix of ['10', '15', '16', '17', '20']) {
      const first10 = prefix + '43210987';
      expect(isValidRuc(first10 + rucCheckDigit(first10))).toBe(true);
    }
    const other = '30' + '43210987';
    expect(isValidRuc(other + rucCheckDigit(other))).toBe(false);
  });

  it('infers the document type from the number of digits', () => {
    expect(docTypeOf('4321 0987')).toBe('DNI');
    expect(docTypeOf('20131312955')).toBe('RUC');
    expect(docTypeOf('123')).toBeNull();
    expect(cleanDocNumber(' 20-131312955 ')).toBe('20131312955');
    expect(isValidDocument('RUC', '20131312955')).toBe(true);
    expect(isValidDocument('DNI', '20131312955')).toBe(false);
  });
});
