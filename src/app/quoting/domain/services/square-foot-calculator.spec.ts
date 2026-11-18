import {
  igvOf, lineSquareFeet, lineTotal, piecePrice, pieceSquareFeet, roundMoney, roundUpToFive, subtotalWithoutIgv,
  toCentimeters
} from './square-foot-calculator';

describe('square-foot-calculator', () => {
  describe('roundUpToFive', () => {
    it('rounds up to the next multiple of 5 cm', () => {
      expect(roundUpToFive(213)).toBe(215);
      expect(roundUpToFive(123)).toBe(125);
      expect(roundUpToFive(211)).toBe(215);
      expect(roundUpToFive(0.5)).toBe(5);
    });

    it('keeps exact multiples of 5', () => {
      expect(roundUpToFive(215)).toBe(215);
      expect(roundUpToFive(120)).toBe(120);
    });

    it('rejects zero, negative and non-numeric measures', () => {
      expect(() => roundUpToFive(0)).toThrow(RangeError);
      expect(() => roundUpToFive(-10)).toThrow(RangeError);
      expect(() => roundUpToFive(NaN)).toThrow(RangeError);
    });
  });

  it('computes square feet of a piece as width × height / 900', () => {
    expect(pieceSquareFeet(120, 60)).toBe(8);
  });

  it('rejects quantities that are not positive integers', () => {
    expect(() => lineSquareFeet(100, 100, 0)).toThrow(RangeError);
    expect(() => lineSquareFeet(100, 100, 1.5)).toThrow(RangeError);
  });

  it('rejects a missing or zero price', () => {
    expect(() => lineTotal(100, 100, 1, 0)).toThrow(RangeError);
  });

  describe('reference cases from the Excel', () => {
    it('case 1: laminado cielo 6 mm, 213 × 123 cm, qty 2, S/ 8.00 → 59.72 ft², S/ 477.78', () => {
      expect(roundUpToFive(213)).toBe(215);
      expect(roundUpToFive(123)).toBe(125);
      expect(roundMoney(lineSquareFeet(213, 123, 2))).toBe(59.72);
      expect(lineTotal(213, 123, 2, 8)).toBe(477.78);
    });

    it('case 2: espejo doble 4 mm, 120 × 60 cm, qty 1, S/ 6.50 → 8 ft², S/ 52.00', () => {
      expect(lineSquareFeet(120, 60, 1)).toBe(8);
      expect(lineTotal(120, 60, 1, 6.5)).toBe(52);
    });
  });

  it('follows the business formula ((width × height / 900) × price) × quantity', () => {
    // 215 × 125 / 900 = 29.8611 ft² per piece; × S/ 8 = S/ 238.89 per piece; × 2 = S/ 477.78
    expect(roundMoney(piecePrice(213, 123, 8))).toBe(238.89);
    const byFormula = ((215 * 125 / 900) * 8) * 2;
    expect(lineTotal(213, 123, 2, 8)).toBe(roundMoney(byFormula));
  });

  describe('toCentimeters', () => {
    it('converts mm and inches to cm', () => {
      expect(toCentimeters(2130, 'mm')).toBe(213);
      expect(toCentimeters(84, 'in')).toBe(213.36);
      expect(toCentimeters(213, 'cm')).toBe(213);
    });

    it('does not let floating-point noise jump to the next 5 cm', () => {
      // 49.2126 in is 125.000004 cm: must bill as 125, not 130
      expect(roundUpToFive(toCentimeters(1250, 'mm'))).toBe(125);
      expect(roundUpToFive(toCentimeters(49.2126, 'in'))).toBe(125);
    });

    it('bills case 1 the same in cm, mm and inches', () => {
      const cm = lineTotal(213, 123, 2, 8);
      expect(lineTotal(toCentimeters(2130, 'mm'), toCentimeters(1230, 'mm'), 2, 8)).toBe(cm);
      expect(lineTotal(toCentimeters(84, 'in'), toCentimeters(48.5, 'in'), 2, 8)).toBe(cm);
      expect(cm).toBe(477.78);
    });

    it('rejects zero or negative measures', () => {
      expect(() => toCentimeters(0, 'mm')).toThrow(RangeError);
    });
  });

  it('treats IGV as included: subtotal = total / 1.18', () => {
    expect(subtotalWithoutIgv(52)).toBe(44.07);
    expect(igvOf(52)).toBe(7.93);
    expect(subtotalWithoutIgv(477.78)).toBe(404.9);
    expect(igvOf(477.78)).toBe(72.88);
  });
});
