import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {SavedQuotesStore} from './saved-quotes.store';
import {QuotesApi} from '../infrastructure/quotes-api';
import {QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';

const snapshot: QuoteDraftSnapshot = {
  customer: {docType: 'DNI', docNumber: '45678912', name: 'Cliente Demo'},
  paymentMethod: 'CASH', advance: 100, termsAccepted: true,
  priceList: {id: 1, name: 'Pública'}, currency: 'PEN', lines: [], extras: [],
  total: 477.78, subtotal: 404.9, igv: 72.88, balance: 377.78,
};

const quote = (id: number, sellerId: number, name: string, createdAt: string): SavedQuote => ({
  ...snapshot, id, number: `COT-${String(id).padStart(6, '0')}`, createdAt, updatedAt: createdAt,
  seller: {id: sellerId, fullName: sellerId === 2 ? 'Ana' : 'Luis'},
  customer: {...snapshot.customer, name},
});

class FakeQuotesApi {
  stored = [quote(1, 2, 'Constructora Ñandú', '2026-11-10T10:00:00Z'), quote(2, 3, 'Juan Pérez', '2026-11-12T10:00:00Z')];
  failWith: number | null = null;
  sent: unknown[] = [];
  getAll(): Observable<SavedQuote[]> { return of(this.stored); }
  getById(id: number): Observable<SavedQuote> {
    const found = this.stored.find(q => q.id === id);
    return found ? of(found) : throwError(() => new HttpErrorResponse({status: 404}));
  }
  create(s: QuoteDraftSnapshot): Observable<SavedQuote> { return this.answer(['create', s], {...quote(3, 2, s.customer.name, '2026-11-18T10:00:00Z'), ...s}); }
  update(id: number, s: QuoteDraftSnapshot): Observable<SavedQuote> { return this.answer(['update', id, s], {...this.stored[0], ...s}); }
  private answer(call: unknown, result: SavedQuote): Observable<SavedQuote> {
    this.sent.push(call);
    return this.failWith ? throwError(() => new HttpErrorResponse({status: this.failWith!})) : of(result);
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

  it('opens one quote, or reports that it does not exist', () => {
    store.open(2);
    expect(store.current()?.number).toBe('COT-000002');
    store.open(99);
    expect(store.error()).toBe('not-found');
  });
});
