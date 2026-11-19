import {landedCosts, roundUnitCost, toSoles} from './landed-cost';

/** Example agreed in the sprint 11 plan (made-up figures). */
describe('landed cost', () => {
  it('converts dollars with the exchange rate and keeps soles as they are', () => {
    expect(toSoles({amount: 100, currency: 'USD'}, 3.75)).toBe(375);
    expect(toSoles({amount: 600, currency: 'PEN'}, 3.75)).toBe(600);
  });

  it('shares the freight by value: the laminated glass carries 90 %, the hinges 10 %', () => {
    const [glass, hinges] = landedCosts(
      [{quantity: 60, unitPriceUsd: 45}, {quantity: 200, unitPriceUsd: 1.5}],
      3.75, {amount: 600, currency: 'PEN'}, {amount: 0, currency: 'PEN'}
    );
    expect(glass.valuePen).toBe(10_125);
    expect(glass.share).toBe(0.9);
    expect(glass.freightPen).toBeCloseTo(540, 6);
    expect(glass.unitCost).toBeCloseTo(177.75, 6);
    expect(hinges.freightPen).toBeCloseTo(60, 6);
    expect(hinges.unitCost).toBeCloseTo(5.925, 6);
  });

  it('adds the Lima → Huaraz transport the same way, also when it is paid in dollars', () => {
    const [glass, hinges] = landedCosts(
      [{quantity: 60, unitPriceUsd: 45}, {quantity: 200, unitPriceUsd: 1.5}],
      3.75, {amount: 600, currency: 'PEN'}, {amount: 40, currency: 'USD'}
    );
    // 40 US$ = S/ 150 → 135 to the glass and 15 to the hinges.
    expect(glass.transportPen).toBeCloseTo(135, 6);
    expect(glass.unitCost).toBeCloseTo((10_125 + 540 + 135) / 60, 6);
    expect(hinges.transportPen).toBeCloseTo(15, 6);
    expect(glass.totalCost + hinges.totalCost).toBeCloseTo(10_125 + 1_125 + 600 + 150, 6);
  });

  it('gives the whole freight to a single line', () => {
    const [only] = landedCosts([{quantity: 10, unitPriceUsd: 2}], 4, {amount: 20, currency: 'PEN'}, {amount: 0, currency: 'USD'});
    expect(only.share).toBe(1);
    expect(only.unitCost).toBe(10);
  });

  it('rejects a missing exchange rate, price or quantity and a negative freight', () => {
    const zero = {amount: 0, currency: 'PEN' as const};
    expect(() => landedCosts([{quantity: 1, unitPriceUsd: 1}], 0, zero, zero)).toThrow(RangeError);
    expect(() => landedCosts([{quantity: 1, unitPriceUsd: 0}], 3.7, zero, zero)).toThrow(RangeError);
    expect(() => landedCosts([{quantity: 1.5, unitPriceUsd: 1}], 3.7, zero, zero)).toThrow(RangeError);
    expect(() => landedCosts([{quantity: 1, unitPriceUsd: 1}], 3.7, {amount: -1, currency: 'PEN'}, zero)).toThrow(RangeError);
  });

  it('stores unit costs with 4 decimals', () => {
    expect(roundUnitCost(5.925)).toBe(5.925);
    expect(roundUnitCost(0.035_678)).toBe(0.0357);
  });
});
