import {isValidAdjustment, isValidQuantity, stockStatus, unitsFromPacks} from './stock-rules';

describe('stock rules', () => {
  describe('stockStatus', () => {
    it('is unknown when the item was never counted in the site', () => {
      expect(stockStatus(null, 5)).toBe('UNKNOWN');
      expect(stockStatus(undefined, null)).toBe('UNKNOWN');
    });

    it('is out of stock at 0 units, even with stock marked "En stock" in the old sheet', () => {
      expect(stockStatus(0, null)).toBe('OUT');
    });

    it('asks to buy again at or below the minimum', () => {
      expect(stockStatus(5, 5)).toBe('LOW');
      expect(stockStatus(4, 5)).toBe('LOW');
      expect(stockStatus(6, 5)).toBe('IN_STOCK');
    });

    it('is in stock when there is no minimum and units are left', () => {
      expect(stockStatus(1, null)).toBe('IN_STOCK');
    });
  });

  it('accepts only whole, non-negative quantities', () => {
    expect(isValidQuantity(0)).toBe(true);
    expect(isValidQuantity(12)).toBe(true);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(2.5)).toBe(false);
  });

  it('rejects adjustments that are zero, fractional or leave the stock negative', () => {
    expect(isValidAdjustment(10, -3)).toBe(true);
    expect(isValidAdjustment(null, 4)).toBe(true);
    expect(isValidAdjustment(10, 0)).toBe(false);
    expect(isValidAdjustment(10, 1.5)).toBe(false);
    expect(isValidAdjustment(2, -3)).toBe(false);
  });

  it('turns packs into units: 3 crates of 20 sheets are 60 sheets', () => {
    expect(unitsFromPacks(3, 20)).toBe(60);
    expect(() => unitsFromPacks(3, 0)).toThrow(RangeError);
    expect(() => unitsFromPacks(1.5, 20)).toThrow(RangeError);
  });
});
