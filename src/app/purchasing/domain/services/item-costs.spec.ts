import {costPerSqFt, isLowMargin, marginOnPrice, summarizeCosts, weightedAverage} from './item-costs';

describe('item costs', () => {
  const entries = [
    {date: '2026-11-20', purchaseId: 3, quantity: 20, unitCost: 190},
    {date: '2026-10-02', purchaseId: 1, quantity: 60, unitCost: 177.75},
    {date: '2026-11-20', purchaseId: 2, quantity: 40, unitCost: 180},
  ];

  it('takes the last cost by date and purchase, with the previous one and its change', () => {
    const summary = summarizeCosts(entries)!;
    expect(summary.last).toBe(190);
    expect(summary.lastDate).toBe('2026-11-20');
    expect(summary.previous).toBe(180);
    expect(summary.changePercent).toBe(5.6);
    expect(summary.purchases).toBe(3);
    expect(summary.unitsBought).toBe(120);
  });

  it('averages the cost weighted by the units of each purchase', () => {
    // (60 × 177.75 + 40 × 180 + 20 × 190) / 120 = 180.5416…
    expect(summarizeCosts(entries)!.average).toBeCloseTo(180.5417, 4);
    expect(weightedAverage([{quantity: 1, unitCost: 10}, {quantity: 3, unitCost: 20}])).toBe(17.5);
    expect(() => weightedAverage([])).toThrow(RangeError);
  });

  it('has no summary without costed purchases, and no change with a single one', () => {
    expect(summarizeCosts([])).toBeNull();
    const single = summarizeCosts([entries[1]])!;
    expect(single.previous).toBeNull();
    expect(single.changePercent).toBeNull();
    expect(single.average).toBe(177.75);
  });

  it('measures the margin on the sale price, negative when selling below cost', () => {
    expect(marginOnPrice(200, 150)).toBe(0.25);
    expect(marginOnPrice(100, 120)).toBe(-0.2);
    expect(() => marginOnPrice(0, 10)).toThrow(RangeError);
  });

  it('turns a sheet cost into a cost per square foot', () => {
    // S/ 177.75 for a 330 × 214 sheet (78.4667 ft²) → S/ 2.2653 per ft².
    expect(costPerSqFt(177.75, 330, 214)).toBeCloseTo(2.2653, 4);
    expect(() => costPerSqFt(100, 0, 214)).toThrow(RangeError);
  });

  it('warns about a low margin only when the CEO set a minimum', () => {
    expect(isLowMargin(0.15, 20)).toBe(true);
    expect(isLowMargin(0.2, 20)).toBe(false);
    expect(isLowMargin(-0.1, null)).toBe(false);
  });
});
