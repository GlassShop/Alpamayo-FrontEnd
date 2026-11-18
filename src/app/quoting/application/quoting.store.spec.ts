import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {Price} from '../../catalog/domain/model/price.entity';
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

describe('QuotingStore', () => {
  let store: QuotingStore;
  let catalog: ReturnType<typeof fakeCatalog>;

  beforeEach(() => {
    catalog = fakeCatalog();
    TestBed.configureTestingModule({providers: [{provide: CatalogStore, useValue: catalog}]});
    store = TestBed.inject(QuotingStore);
  });

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
});
