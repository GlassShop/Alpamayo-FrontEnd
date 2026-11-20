import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {Price} from '../../catalog/domain/model/price.entity';
import {ProductsStore} from '../../catalog/application/products.store';
import {SaleSettingsStore} from '../../catalog/application/sale-settings.store';
import {Product} from '../../catalog/domain/model/product.entity';
import {IamStore} from '../../iam/application/iam.store';
import {QuotingStore} from './quoting.store';

/** Fake catalog: test fixtures only, real prices always come from the API. */
function fakeCatalog() {
  const prices = signal<Price[]>([
    {id: 1, glassTypeId: 1, priceListId: 1, pricePerSqFt: 8},
    {id: 2, glassTypeId: 1, priceListId: 2, pricePerSqFt: 7},
    {id: 3, glassTypeId: 2, priceListId: 1, pricePerSqFt: 6.5},
  ]);
  return {
    prices,
    glassTypes: signal([
      {id: 1, name: 'Laminado', thicknessMm: 6, color: 'cielo'},
      {id: 2, name: 'Espejo doble', thicknessMm: 4, color: ''},
    ]),
    priceLists: signal([{id: 1, name: 'Pública'}, {id: 2, name: 'Vidriero'}]),
    priceFor: (g: number, l: number) =>
      prices().find(p => p.glassTypeId === g && p.priceListId === l)?.pricePerSqFt ?? null,
  };
}

/** Fake product catalog: one aluminium bar and one accessory. */
function fakeProducts() {
  const products = signal<Product[]>([
    {id: 10, category: 'ALUMINUM_SERIES', code: '6001', name: 'Marco doble corredizo', seriesId: 1, brand: '', weightClass: null, publicPrice: 85},
    {id: 11, category: 'ACCESSORY', code: '', name: 'Garrucha', brand: 'Parma', seriesId: null, weightClass: null, publicPrice: null},
  ]);
  return {products, product: (id: number) => products().find(p => p.id === id)};
}

/** Fake signed-in user; `role` decides whether discounts have a limit. */
function fakeIam() {
  const user = signal<{id: number; role: 'CEO' | 'SELLER'} | null>({id: 2, role: 'SELLER'});
  return {currentUser: user, can: (p: string) => p === 'prices.manage' && user()?.role === 'CEO'};
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; }, clear: () => data.clear(), key: () => null,
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

describe('QuotingStore', () => {
  let store: QuotingStore;
  let catalog: ReturnType<typeof fakeCatalog>;
  let products: ReturnType<typeof fakeProducts>;
  let iam: ReturnType<typeof fakeIam>;
  let maxDiscount: ReturnType<typeof signal<number | null>>;

  function createStore(): QuotingStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [
      {provide: CatalogStore, useValue: catalog},
      {provide: ProductsStore, useValue: products},
      {provide: SaleSettingsStore, useValue: {maxDiscountPercent: maxDiscount}},
      {provide: IamStore, useValue: iam},
    ]});
    return TestBed.inject(QuotingStore);
  }

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    catalog = fakeCatalog();
    products = fakeProducts();
    iam = fakeIam();
    maxDiscount = signal<number | null>(null);
    store = createStore();
  });

  afterEach(() => vi.unstubAllGlobals());

  function addLaminadoCase1(): number {
    store.addLine(1);
    const id = store.lines()[0].id;
    store.updateLine(id, {width: 213, height: 123, quantity: 2});
    return id;
  }

  it('defaults to the first price list of the catalog', () => {
    expect(store.priceListId()).toBe(1);
  });

  it('prices case 1 instantly with the CEO price of the selected list', () => {
    addLaminadoCase1();
    const [view] = store.lineViews();
    expect(view.roundedWidthCm).toBe(215);
    expect(view.roundedHeightCm).toBe(125);
    expect(view.squareFeet).toBe(59.72);
    expect(view.pricePerSqFt).toBe(8);
    expect(store.total()).toBe(477.78);
  });

  it('recalculates when the seller switches price list', () => {
    addLaminadoCase1();
    store.selectPriceList(2);
    expect(store.lineViews()[0].pricePerSqFt).toBe(7);
    expect(store.total()).toBe(418.06);
  });

  it('follows price changes made by the CEO', () => {
    addLaminadoCase1();
    catalog.prices.update(list => list.map(p => p.id === 1 ? {...p, pricePerSqFt: 9} : p));
    expect(store.total()).toBe(537.5);
  });

  it('flags a line without CEO price and leaves it out of the total', () => {
    store.addLine(2);
    const id = store.lines()[0].id;
    store.updateLine(id, {width: 120, height: 60});
    store.selectPriceList(2);
    expect(store.lineViews()[0].issue).toBe('no-price');
    expect(store.total()).toBe(0);
    expect(store.isComplete()).toBe(false);
  });

  it('waits for measures before pricing a line', () => {
    store.addLine(1);
    expect(store.lineViews()[0].issue).toBe('missing-measures');
    expect(store.total()).toBe(0);
  });

  it('adds lines and splits IGV out of the included total', () => {
    addLaminadoCase1();
    store.addLine(2);
    store.updateLine(store.lines()[1].id, {width: 120, height: 60, quantity: 1});
    expect(store.total()).toBe(529.78);
    expect(store.subtotal()).toBe(448.97);
    expect(store.igv()).toBe(80.81);
    expect(store.isComplete()).toBe(true);
  });

  it('adds a complete line in one call and previews a draft without adding it', () => {
    const draft = {glassTypeId: 2, width: 120, height: 60, unit: 'cm' as const, quantity: 1};
    expect(store.preview(draft).total).toBe(52);
    expect(store.lines()).toEqual([]);
    store.addLine(2, {width: 120, height: 60, quantity: 1});
    expect(store.total()).toBe(52);
    expect(store.pieces()).toBe(1);
  });

  it('bills a line in mm or inches the same as in cm', () => {
    const id = addLaminadoCase1();
    expect(store.total()).toBe(477.78);
    store.updateLine(id, {width: 2130, height: 1230, unit: 'mm'});
    expect(store.lineViews()[0].roundedWidthCm).toBe(215);
    expect(store.total()).toBe(477.78);
    store.updateLine(id, {width: 84, height: 48.5, unit: 'in'});
    expect(store.lineViews()[0].roundedHeightCm).toBe(125);
    expect(store.total()).toBe(477.78);
  });

  it('replaces every line with imported ones', () => {
    addLaminadoCase1();
    store.replaceLines([
      {glassTypeId: 2, width: 1200, height: 600, unit: 'mm', quantity: 1, reference: 'Espejo baño'},
    ]);
    expect(store.lines().length).toBe(1);
    expect(store.lines()[0].reference).toBe('Espejo baño');
    expect(store.total()).toBe(52);
  });

  it('removes a line', () => {
    const id = addLaminadoCase1();
    store.removeLine(id);
    expect(store.lines()).toEqual([]);
    expect(store.total()).toBe(0);
  });

  describe('additional concepts', () => {
    it('add the seller-typed price to the IGV-included total', () => {
      addLaminadoCase1();
      store.addExtra({description: 'Instalación', quantity: 1, unitPrice: 50});
      expect(store.total()).toBe(527.78);
      expect(store.subtotal()).toBe(447.27);
      expect(store.igv()).toBe(80.51);
    });

    it('are left out of the total and block saving while incomplete', () => {
      addLaminadoCase1();
      const id = store.addExtra({description: '', quantity: 1, unitPrice: 50});
      expect(store.extraViews()[0].total).toBeNull();
      expect(store.total()).toBe(477.78);
      expect(store.canSave()).toBe(false);
      store.updateExtra(id, {description: 'Transporte'});
      expect(store.canSave()).toBe(true);
      store.removeExtra(id);
      expect(store.extras()).toEqual([]);
    });
  });

  describe('saving', () => {
    const details = {
      customer: {docType: 'DNI' as const, docNumber: '45678912', name: 'Cliente Demo'},
      paymentMethod: 'YAPE' as const, advance: 200, termsAccepted: true,
    };

    it('freezes prices, square feet and totals in a snapshot', () => {
      addLaminadoCase1();
      store.addExtra({description: 'Instalación', quantity: 1, unitPrice: 50});
      const snapshot = store.toSnapshot(details)!;
      expect(snapshot.priceList).toEqual({id: 1, name: 'Pública'});
      expect(snapshot.lines[0]).toMatchObject({
        description: 'Laminado 6 mm cielo', billedWidthCm: 215, billedHeightCm: 125,
        quantity: 2, squareFeet: 59.72, pricePerSqFt: 8, unitPrice: 238.89, total: 477.78,
      });
      expect(snapshot.extras).toEqual([{description: 'Instalación', quantity: 1, unitPrice: 50, total: 50}]);
      expect(snapshot).toMatchObject({total: 527.78, advance: 200, balance: 327.78, currency: 'PEN'});
    });

    it('returns no snapshot while a line has no price', () => {
      store.addLine(2, {width: 100, height: 100});
      store.selectPriceList(2);
      expect(store.toSnapshot(details)).toBeNull();
    });

    it('reloads a saved quote for editing and warns when current prices changed', () => {
      addLaminadoCase1();
      const snapshot = store.toSnapshot(details)!;
      const saved = {...snapshot, id: 7, number: 'COT-000007', createdAt: '', updatedAt: '', seller: {id: 2, fullName: 'Ana'}};
      store.clear();
      store.loadForEditing(saved);
      expect(store.editing()).toMatchObject({id: 7, number: 'COT-000007', savedTotal: 477.78});
      expect(store.editing()?.details.customer.name).toBe('Cliente Demo');
      expect(store.total()).toBe(477.78);
      expect(store.priceChanged()).toBe(false);

      catalog.prices.update(list => list.map(p => p.id === 1 ? {...p, pricePerSqFt: 9} : p));
      expect(store.priceChanged()).toBe(true);
      store.clear();
      expect(store.editing()).toBeNull();
    });

    it('freezes products and the catalog price next to the final one', () => {
      maxDiscount.set(10);
      const glass = addLaminadoCase1();
      store.updateLine(glass, {adjustedPrice: 7.5});
      const bar = store.addProduct(10, 'Negro', 2)!;
      store.updateProduct(bar, {adjustedPrice: 80});
      const snapshot = store.toSnapshot(details)!;
      expect(snapshot.lines[0]).toMatchObject({pricePerSqFt: 7.5, catalogPricePerSqFt: 8, total: 447.92});
      expect(snapshot.products).toEqual([{
        productId: 10, description: '6001 Marco doble corredizo', color: 'Negro', saleUnit: 'BAR',
        quantity: 2, catalogUnitPrice: 85, unitPrice: 80, total: 160,
      }]);
      expect(snapshot.total).toBe(607.92);
    });

    it('keeps the final prices typed by the seller when a quote is edited again', () => {
      maxDiscount.set(10);
      const glass = addLaminadoCase1();
      store.updateLine(glass, {adjustedPrice: 7.5});
      store.updateProduct(store.addProduct(10, '', 1)!, {adjustedPrice: 80});
      const saved = {...store.toSnapshot(details)!, id: 8, number: 'COT-000008', createdAt: '', updatedAt: '', seller: {id: 2, fullName: 'Ana'}};
      store.clear();
      store.loadForEditing(saved);
      expect(store.lines()[0].adjustedPrice).toBe(7.5);
      expect(store.products()[0]).toMatchObject({productId: 10, adjustedPrice: 80});
      expect(store.priceChanged()).toBe(false);
    });

    it('opens quotes saved before products existed', () => {
      addLaminadoCase1();
      const {products: _ignored, ...old} = store.toSnapshot(details)!;
      store.clear();
      store.loadForEditing({...old, id: 1, number: 'COT-000001', createdAt: '', updatedAt: '', seller: {id: 2, fullName: 'Ana'}} as never);
      expect(store.products()).toEqual([]);
      expect(store.total()).toBe(477.78);
    });
  });

  describe('catalog products', () => {
    it('price whole bars, units or sheets at the public price', () => {
      store.addProduct(10, 'Negro', 3);
      const [view] = store.productViews();
      expect(view).toMatchObject({label: '6001 Marco doble corredizo', saleUnit: 'BAR', catalogPrice: 85, unitPrice: 85, total: 255, issue: null});
      expect(store.total()).toBe(255);
    });

    it('add up the same product in the same colour and keep other colours apart', () => {
      store.addProduct(10, 'Negro', 2);
      store.addProduct(10, ' negro ', 1);
      store.addProduct(10, 'Natural', 1);
      expect(store.products().map(p => [p.color, p.quantity])).toEqual([['Negro', 3], ['Natural', 1]]);
    });

    it('accept only whole quantities of at least one', () => {
      expect(store.addProduct(10, '', 1.5)).toBeNull();
      expect(store.addProduct(10, '', 0)).toBeNull();
      const id = store.addProduct(10, '', 1)!;
      store.updateProduct(id, {quantity: 2.5});
      expect(store.productViews()[0].issue).toBe('invalid-quantity');
      expect(store.canSave()).toBe(false);
    });

    it('block saving while a product has no public price', () => {
      store.addProduct(11, '', 4);
      expect(store.productViews()[0].issue).toBe('no-price');
      expect(store.canSave()).toBe(false);
    });

    it('use the public price even when glass uses another price list', () => {
      store.selectPriceList(2);
      store.addProduct(10, '', 1);
      expect(store.productViews()[0].unitPrice).toBe(85);
    });

    it('are removed and counted on the quote bar', () => {
      addLaminadoCase1();
      const id = store.addProduct(10, '', 1)!;
      store.addExtra({description: 'Instalación', quantity: 1, unitPrice: 50});
      expect(store.rowCount()).toBe(3);
      store.removeProduct(id);
      expect(store.rowCount()).toBe(2);
    });
  });

  describe('final price typed by the seller', () => {
    it('allows no discount while the CEO has not set a limit', () => {
      const id = store.addProduct(10, '', 1)!;
      store.updateProduct(id, {adjustedPrice: 84});
      expect(store.productViews()[0]).toMatchObject({adjusted: true, minPrice: 85, issue: 'below-limit'});
      expect(store.canSave()).toBe(false);
    });

    it('allows lowering a product down to the CEO limit', () => {
      maxDiscount.set(10);
      const id = store.addProduct(10, '', 2)!;
      store.updateProduct(id, {adjustedPrice: 76.5});
      expect(store.productViews()[0]).toMatchObject({unitPrice: 76.5, total: 153, discountPercent: 10, issue: null});
      store.updateProduct(id, {adjustedPrice: 76.49});
      expect(store.productViews()[0].issue).toBe('below-limit');
    });

    it('applies to the price per square foot of glass', () => {
      maxDiscount.set(10);
      const id = addLaminadoCase1();
      store.updateLine(id, {adjustedPrice: 7.2});
      expect(store.lineViews()[0]).toMatchObject({catalogPricePerSqFt: 8, pricePerSqFt: 7.2, total: 430, issue: null});
      store.updateLine(id, {adjustedPrice: 7.1});
      expect(store.lineViews()[0].issue).toBe('below-limit');
    });

    it('always allows raising a price', () => {
      const id = store.addProduct(10, '', 1)!;
      store.updateProduct(id, {adjustedPrice: 95});
      expect(store.productViews()[0]).toMatchObject({unitPrice: 95, discountPercent: -11.8, issue: null});
    });

    it('gives the CEO no limit', () => {
      iam.currentUser.set({id: 1, role: 'CEO'});
      TestBed.tick();
      const id = store.addProduct(10, '', 1)!;
      store.updateProduct(id, {adjustedPrice: 40});
      expect(store.productViews()[0]).toMatchObject({minPrice: null, issue: null});
    });

    it('typing the catalog price again is not an adjustment', () => {
      const id = store.addProduct(10, '', 1)!;
      store.updateProduct(id, {adjustedPrice: 85});
      expect(store.productViews()[0].adjusted).toBe(false);
    });
  });

  describe('draft kept in the browser session', () => {
    it('survives a reload of the page', () => {
      addLaminadoCase1();
      store.addProduct(10, 'Negro', 2);
      store.selectPriceList(2);
      const reloaded = createStore();
      expect(reloaded.lines()).toHaveLength(1);
      expect(reloaded.products()[0]).toMatchObject({productId: 10, color: 'Negro', quantity: 2});
      expect(reloaded.priceListId()).toBe(2);
      // New rows never reuse an id of the restored ones.
      const id = reloaded.addProduct(10, 'Natural', 1)!;
      expect(reloaded.products().filter(p => p.id === id)).toHaveLength(1);
    });

    it('is forgotten when the quote is cleared', () => {
      store.addProduct(10, '', 1);
      store.clear();
      expect(createStore().rowCount()).toBe(0);
    });

    it('belongs to the signed-in user only', () => {
      store.addProduct(10, '', 1);
      iam.currentUser.set({id: 3, role: 'SELLER'});
      TestBed.tick();
      expect(store.rowCount()).toBe(0);
      iam.currentUser.set({id: 2, role: 'SELLER'});
      TestBed.tick();
      expect(store.rowCount()).toBe(1);
    });

    it('ignores a damaged draft', () => {
      sessionStorage.setItem('alpamayo.quote-draft.2', '{not json');
      expect(createStore().rowCount()).toBe(0);
    });
  });
});
