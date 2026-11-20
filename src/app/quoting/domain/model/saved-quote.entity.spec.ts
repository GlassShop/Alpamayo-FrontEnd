import {quoteDiscount, SavedGlassLine, SavedProductLine} from './saved-quote.entity';

const glass = (over: Partial<SavedGlassLine>): SavedGlassLine => ({
  glassTypeId: 1, description: 'Laminado 6 mm cielo', width: 213, height: 123, unit: 'cm', billedWidthCm: 215,
  billedHeightCm: 125, quantity: 2, squareFeet: 59.72, pricePerSqFt: 8, unitPrice: 238.89, total: 477.78, ...over,
});
const product = (over: Partial<SavedProductLine>): SavedProductLine => ({
  productId: 10, description: '6001 Marco', color: 'Negro', saleUnit: 'BAR', quantity: 2,
  catalogUnitPrice: 85, unitPrice: 85, total: 170, ...over,
});

describe('quoteDiscount', () => {
  it('is zero when every line keeps its catalog price', () => {
    expect(quoteDiscount({lines: [glass({catalogPricePerSqFt: 8})], products: [product({})]})).toBe(0);
  });

  it('adds what was taken off glass and products', () => {
    const lines = [glass({pricePerSqFt: 7.5, catalogPricePerSqFt: 8, total: 447.92})];
    const products = [product({unitPrice: 80, total: 160})];
    expect(quoteDiscount({lines, products})).toBe(39.86);   // 29.86 on glass + 10 on bars
  });

  it('does not let a raised price hide a discount', () => {
    const products = [product({unitPrice: 95, total: 190}), product({unitPrice: 80, total: 160})];
    expect(quoteDiscount({lines: [], products})).toBe(10);
  });

  it('reads quotes saved before discounts and products existed', () => {
    expect(quoteDiscount({lines: [glass({})], products: undefined as never})).toBe(0);
  });
});
