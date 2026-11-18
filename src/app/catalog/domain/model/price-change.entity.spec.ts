import {changePercent} from './price-change.entity';

describe('changePercent', () => {
  it('reports rises and drops with one decimal', () => {
    expect(changePercent({previousPrice: 8, newPrice: 9})).toBe(12.5);
    expect(changePercent({previousPrice: 8, newPrice: 7.2})).toBe(-10);
    expect(changePercent({previousPrice: 6.5, newPrice: 6.5})).toBe(0);
    expect(changePercent({previousPrice: 3, newPrice: 4})).toBe(33.3);
  });

  it('has no percentage for a first price', () => {
    expect(changePercent({previousPrice: null, newPrice: 8})).toBeNull();
  });
});
