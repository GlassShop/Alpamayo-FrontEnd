import {discountPercent, isAllowedPrice, minAllowedPrice} from './price-adjustment';

describe('price adjustment rule', () => {
  it('rounds the lowest allowed price up to the cent', () => {
    expect(minAllowedPrice(85, 10)).toBe(76.5);
    expect(minAllowedPrice(8.37, 7)).toBe(7.79);   // 7.7841 → 7.79, never below the limit
    expect(minAllowedPrice(8, null)).toBe(8);       // no limit set: no discount
  });

  it('lets a seller lower the price only down to the CEO limit', () => {
    expect(isAllowedPrice(85, 76.5, 10, false)).toBe(true);
    expect(isAllowedPrice(85, 76.49, 10, false)).toBe(false);
  });

  it('allows no discount while the CEO has not set a limit', () => {
    expect(isAllowedPrice(85, 84.99, null, false)).toBe(false);
    expect(isAllowedPrice(85, 85, null, false)).toBe(true);
  });

  it('always allows raising the price', () => {
    expect(isAllowedPrice(85, 120, null, false)).toBe(true);
  });

  it('gives the CEO no limit, but never a zero or negative price', () => {
    expect(isAllowedPrice(85, 10, 5, true)).toBe(true);
    expect(isAllowedPrice(85, 0, 5, true)).toBe(false);
  });

  it('measures the discount against the catalog price', () => {
    expect(discountPercent(85, 76.5)).toBe(10);
    expect(discountPercent(8, 8.5)).toBe(-6.3);
    expect(discountPercent(0, 5)).toBe(0);
  });
});
