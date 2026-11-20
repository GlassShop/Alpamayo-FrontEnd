import {SavedProductLine} from '../model/saved-quote.entity';
import {canSell, planSale, StockItemRef, toSaleLines} from './sale-plan';

const line = (productId: number, color: string, quantity: number): SavedProductLine => ({
  productId, description: `Producto ${productId}`, color, saleUnit: 'BAR', quantity,
  catalogUnitPrice: 10, unitPrice: 10, total: 10 * quantity,
});

const items: StockItemRef[] = [
  {id: 1, productId: 10, color: 'Negro'},
  {id: 2, productId: 10, color: 'Natural'},
  {id: 3, productId: 20, color: ''},
  // Sheets: same product and colour, two sizes.
  {id: 4, productId: 30, color: 'Incoloro'},
  {id: 5, productId: 30, color: 'Incoloro'},
];

/** Site 1: item 1 has 5, item 3 has 2, item 4 has 10; item 2 was never counted. */
const stock = new Map<string, number>([['1:1', 5], ['3:1', 2], ['4:1', 10], ['5:1', 0]]);
const quantityAt = (itemId: number, siteId: number) => stock.get(`${itemId}:${siteId}`) ?? null;

describe('planSale', () => {
  it('takes each product from its item in the line colour and shows what is left', () => {
    const plan = planSale([line(10, ' negro ', 3)], 1, items, quantityAt);
    expect(plan[0]).toMatchObject({itemId: 1, before: 5, after: 2, problem: null});
    expect(canSell(plan)).toBe(true);
    expect(toSaleLines(plan)).toEqual([{productIndex: 0, itemId: 1, quantity: 3}]);
  });

  it('blocks a product that is not in the inventory in that colour', () => {
    const plan = planSale([line(10, 'Champagne', 1), line(99, '', 1)], 1, items, quantityAt);
    expect(plan.map(l => l.problem)).toEqual(['no-item', 'no-item']);
    expect(canSell(plan)).toBe(false);
  });

  it('blocks an item never counted in the site', () => {
    expect(planSale([line(10, 'Natural', 1)], 1, items, quantityAt)[0].problem).toBe('not-counted');
  });

  it('blocks when the site has fewer units than sold, never leaving negative stock', () => {
    const [plan] = planSale([line(20, '', 3)], 1, items, quantityAt);
    expect(plan).toMatchObject({before: 2, after: -1, problem: 'not-enough'});
  });

  it('asks to choose when several items fit, and checks the chosen one', () => {
    const products = [line(30, 'Incoloro', 2)];
    expect(planSale(products, 1, items, quantityAt)[0].problem).toBe('choose-item');
    expect(planSale(products, 1, items, quantityAt, new Map([[0, 4]]))[0]).toMatchObject({itemId: 4, after: 8, problem: null});
    expect(planSale(products, 1, items, quantityAt, new Map([[0, 5]]))[0].problem).toBe('not-enough');
    // A choice that does not belong to the line is ignored.
    expect(planSale(products, 1, items, quantityAt, new Map([[0, 1]]))[0].problem).toBe('choose-item');
  });

  it('adds up lines that take from the same item', () => {
    const plan = planSale([line(10, 'Negro', 3), line(10, 'Negro', 3)], 1, items, quantityAt);
    expect(plan.map(l => l.problem)).toEqual(['not-enough', 'not-enough']);
  });

  it('checks the stock of the chosen site', () => {
    expect(planSale([line(10, 'Negro', 1)], 2, items, quantityAt)[0].problem).toBe('not-counted');
  });

  it('lets a quote without products be sold', () => {
    expect(canSell(planSale([], 1, items, quantityAt))).toBe(true);
  });
});
