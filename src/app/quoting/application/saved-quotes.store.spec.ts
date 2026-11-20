import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {SavedQuotesStore} from './saved-quotes.store';
import {QuotesApi, SellCommand, StockChangeResult} from '../infrastructure/quotes-api';
import {QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';

const snapshot: QuoteDraftSnapshot = {
  customer: {docType: 'DNI', docNumber: '45678912', name: 'Cliente Demo'},
  paymentMethod: 'CASH', advance: 100, termsAccepted: true,
  priceList: {id: 1, name: 'Pública'}, currency: 'PEN', lines: [], products: [], extras: [],
  total: 477.78, subtotal: 404.9, igv: 72.88, balance: 377.78,
};

const quote = (id: number, sellerId: number, name: string, createdAt: string): SavedQuote => ({
  ...snapshot, id, number: `COT-${String(id).padStart(6, '0')}`, createdAt, updatedAt: createdAt,
  seller: {id: sellerId, fullName: sellerId === 2 ? 'Ana' : 'Luis'},
  customer: {...snapshot.customer, name},
  status: 'OPEN', sale: null, cancelledSales: [],
});

const level = {id: 9, itemId: 1, siteId: 1, quantity: 2, inTransit: false, notes: ''};
const sale = {siteId: 1, siteName: 'Principal', at: '2026-11-20T10:00:00Z', by: {id: 2, fullName: 'Ana'}, lines: []};

class FakeQuotesApi {
  stored = [quote(1, 2, 'Constructora Ñandú', '2026-11-10T10:00:00Z'), quote(2, 3, 'Juan Pérez', '2026-11-12T10:00:00Z')];
  failWith: number | null = null;
  failCode: string | null = null;
  sent: unknown[] = [];
  getAll(): Observable<SavedQuote[]> { return of(this.stored); }
  getById(id: number): Observable<SavedQuote> {
    const found = this.stored.find(q => q.id === id);
    return found ? of(found) : throwError(() => new HttpErrorResponse({status: 404}));
  }
  create(s: QuoteDraftSnapshot): Observable<SavedQuote> { return this.answer(['create', s], {...quote(3, 2, s.customer.name, '2026-11-18T10:00:00Z'), ...s}); }
  update(id: number, s: QuoteDraftSnapshot): Observable<SavedQuote> { return this.answer(['update', id, s], {...this.stored[0], ...s}); }
  sell(id: number, command: SellCommand): Observable<StockChangeResult> {
    const sold = {...this.stored.find(q => q.id === id)!, status: 'SOLD' as const, sale};
    return this.answer(['sell', id, command], {quote: sold, levels: [level]});
  }
  cancelSale(id: number, reason: string): Observable<StockChangeResult> {
    return this.answer(['cancel', id, reason], {quote: {...this.stored.find(q => q.id === id)!, status: 'OPEN'}, levels: [level]});
  }
  private answer<T>(call: unknown, result: T): Observable<T> {
    this.sent.push(call);
    return this.failWith
      ? throwError(() => new HttpErrorResponse({status: this.failWith!, error: this.failCode ? {code: this.failCode} : null}))
      : of(result);
  }
}

describe('SavedQuotesStore', () => {
  let store: SavedQuotesStore;
  let api: FakeQuotesApi;

  beforeEach(() => {
    api = new FakeQuotesApi();
    TestBed.configureTestingModule({providers: [{provide: QuotesApi, useValue: api}]});
    store = TestBed.inject(SavedQuotesStore);
    store.load();
  });

  it('lists the newest first and searches by customer (ignoring accents), document or number', () => {
    expect(store.quotes().map(q => q.number)).toEqual(['COT-000002', 'COT-000001']);
    store.search.set('nandu');
    expect(store.quotes().map(q => q.id)).toEqual([1]);
    store.search.set('COT-000002');
    expect(store.quotes().map(q => q.id)).toEqual([2]);
  });

  it('filters by seller for the CEO', () => {
    expect(store.sellers()).toEqual([{id: 2, fullName: 'Ana'}, {id: 3, fullName: 'Luis'}]);
    store.sellerFilter.set(3);
    expect(store.quotes().map(q => q.id)).toEqual([2]);
  });

  it('creates and updates quotes', () => {
    let saved: SavedQuote | undefined;
    store.save(snapshot, null, q => saved = q);
    expect(api.sent[0]).toEqual(['create', snapshot]);
    expect(saved?.id).toBe(3);
    expect(store.quotes()[0].id).toBe(3);
    store.save(snapshot, 1, q => saved = q);
    expect(api.sent[1]).toEqual(['update', 1, snapshot]);
  });

  it('rejects invalid data before calling the API', () => {
    const attempt = (changes: Partial<QuoteDraftSnapshot>) => {
      store.save({...snapshot, ...changes}, null, () => undefined);
      return store.error();
    };
    expect(attempt({advance: 500})).toBe('invalid-advance');
    expect(attempt({advance: -1})).toBe('invalid-advance');
    expect(attempt({termsAccepted: false})).toBe('terms-not-accepted');
    expect(attempt({customer: {docType: 'RUC', docNumber: '20131312954', name: 'X'}})).toBe('invalid-document');
    expect(attempt({customer: {docType: 'DNI', docNumber: '45678912', name: ' '}})).toBe('missing-name');
    store.save(null, null, () => undefined);
    expect(store.error()).toBe('incomplete');
    expect(api.sent).toEqual([]);
  });

  it('explains a price change detected by the server (422)', () => {
    api.failWith = 422;
    store.save(snapshot, null, () => undefined);
    expect(store.error()).toBe('totals-mismatch');
  });

  it('explains a discount the server no longer allows', () => {
    api.failWith = 400;
    api.failCode = 'discount-too-high';
    store.save(snapshot, null, () => undefined);
    expect(store.error()).toBe('discount-too-high');
  });

  it('opens one quote, or reports that it does not exist', () => {
    store.open(2);
    expect(store.current()?.number).toBe('COT-000002');
    store.open(99);
    expect(store.error()).toBe('not-found');
  });

  describe('sales', () => {
    it('marks a quote as sold, updates the list and the open quote, and hands over the stock levels', () => {
      store.open(1);
      const done = vi.fn();
      store.sell(1, {siteId: 1, lines: []}, done);
      expect(api.sent).toEqual([['sell', 1, {siteId: 1, lines: []}]]);
      expect(store.current()?.status).toBe('SOLD');
      expect(store.quotes().find(q => q.id === 1)?.status).toBe('SOLD');
      expect(done).toHaveBeenCalledWith(expect.objectContaining({levels: [level]}));
    });

    it('filters the list by state', () => {
      store.sell(1, {siteId: 1, lines: []}, () => undefined);
      store.statusFilter.set('SOLD');
      expect(store.quotes().map(q => q.id)).toEqual([1]);
      store.statusFilter.set('OPEN');
      expect(store.quotes().map(q => q.id)).toEqual([2]);
    });

    it('explains when the stock changed since the dialog was opened', () => {
      api.failWith = 409;
      api.failCode = 'stock-problem';
      store.sell(1, {siteId: 1, lines: []}, () => undefined);
      expect(store.error()).toBe('stock-changed');
    });

    it('explains when the quote was sold meanwhile, also when trying to save it', () => {
      api.failWith = 409;
      api.failCode = 'sold';
      store.sell(1, {siteId: 1, lines: []}, () => undefined);
      expect(store.error()).toBe('sold');
      store.save(snapshot, 1, () => undefined);
      expect(store.error()).toBe('sold');
    });

    it('requires a reason to annul a sale', () => {
      store.cancelSale(1, '   ', () => undefined);
      expect(store.error()).toBe('missing-reason');
      expect(api.sent).toEqual([]);
      store.cancelSale(1, ' Cliente devolvió todo ', () => undefined);
      expect(api.sent).toEqual([['cancel', 1, 'Cliente devolvió todo']]);
      expect(store.quotes().find(q => q.id === 1)?.status).toBe('OPEN');
    });
  });
});
