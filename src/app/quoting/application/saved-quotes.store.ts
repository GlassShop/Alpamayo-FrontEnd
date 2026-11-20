import {computed, inject, Injectable, signal} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {QuotesApi, SellCommand, StockChangeResult} from '../infrastructure/quotes-api';
import {QuoteDraftSnapshot, QuoteStatus, SavedQuote} from '../domain/model/saved-quote.entity';
import {isValidDocument} from '../domain/model/document-id';

/** Why saving or loading failed. Values are translation key suffixes. */
export type SavedQuotesError =
  | 'load' | 'not-found' | 'save' | 'incomplete'
  | 'invalid-document' | 'missing-name' | 'invalid-advance' | 'terms-not-accepted' | 'totals-mismatch'
  | 'discount-too-high'
  // Sales
  | 'sold' | 'stock-changed' | 'sale' | 'missing-reason';

/** Filter of the list by state. */
export type StatusFilter = 'ALL' | QuoteStatus;

/** Normalised text for searching: lower case, no accents. */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Saved quotes: "Mis cotizaciones" for sellers and every quote for the CEO
 * (the server already filters by user; the CEO can filter by seller here).
 */
@Injectable({providedIn: 'root'})
export class SavedQuotesStore {
  private readonly api = inject(QuotesApi);

  private readonly quotesSignal = signal<SavedQuote[]>([]);
  private readonly currentSignal = signal<SavedQuote | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<SavedQuotesError | null>(null);

  readonly search = signal('');
  /** Seller id to filter by (CEO only), or null for everyone. */
  readonly sellerFilter = signal<number | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  /** Quote opened in the print view. */
  readonly current = this.currentSignal.asReadonly();

  /** Newest first, filtered by the search text, the seller and the state. */
  readonly quotes = computed(() => {
    const q = fold(this.search().trim());
    const seller = this.sellerFilter();
    const status = this.statusFilter();
    return [...this.quotesSignal()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter(quote => seller === null || quote.seller.id === seller)
      .filter(quote => status === 'ALL' || quote.status === status)
      .filter(quote => !q || [quote.number, quote.customer.name, quote.customer.docNumber].some(t => fold(t).includes(q)));
  });

  /** Sellers that appear in the loaded quotes, for the CEO filter. */
  readonly sellers = computed(() => {
    const byId = new Map(this.quotesSignal().map(q => [q.seller.id, q.seller.fullName]));
    return [...byId].map(([id, fullName]) => ({id, fullName})).sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll().subscribe({
      next: quotes => { this.quotesSignal.set(quotes); this.loadingSignal.set(false); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  /** Loads one quote (e.g. for the print view or to edit it). */
  open(id: number, onLoaded?: (quote: SavedQuote) => void): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.currentSignal.set(null);
    this.api.getById(id).subscribe({
      next: quote => { this.currentSignal.set(quote); this.loadingSignal.set(false); onLoaded?.(quote); },
      error: (e: unknown) => {
        this.errorSignal.set(e instanceof HttpErrorResponse && e.status === 404 ? 'not-found' : 'load');
        this.loadingSignal.set(false);
      }
    });
  }

  /** Checks what the seller filled in before sending; returns the first problem or null. */
  validate(snapshot: QuoteDraftSnapshot | null): SavedQuotesError | null {
    if (!snapshot) return 'incomplete';
    if (!isValidDocument(snapshot.customer.docType, snapshot.customer.docNumber)) return 'invalid-document';
    if (!snapshot.customer.name.trim()) return 'missing-name';
    if (!Number.isFinite(snapshot.advance) || snapshot.advance < 0 || snapshot.advance > snapshot.total) return 'invalid-advance';
    if (!snapshot.termsAccepted) return 'terms-not-accepted';
    return null;
  }

  /** Creates the quote, or updates it when `id` is given. */
  save(snapshot: QuoteDraftSnapshot | null, id: number | null, onSaved: (quote: SavedQuote) => void): void {
    const problem = this.validate(snapshot);
    if (problem) { this.errorSignal.set(problem); return; }
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    const request$ = id === null ? this.api.create(snapshot!) : this.api.update(id, snapshot!);
    request$.subscribe({
      next: saved => {
        this.quotesSignal.update(list => [saved, ...list.filter(q => q.id !== saved.id)]);
        this.savingSignal.set(false);
        onSaved(saved);
      },
      error: (e: unknown) => {
        this.savingSignal.set(false);
        this.errorSignal.set(saveError(e));
      }
    });
  }

  /**
   * Marks a quote as sold from a site. `onDone` receives the stock levels the
   * server changed, so the inventory can show them at once.
   */
  sell(id: number, command: SellCommand, onDone: (result: StockChangeResult) => void): void {
    if (!Number.isInteger(command.siteId)) { this.errorSignal.set('sale'); return; }
    this.changeSale(this.api.sell(id, command), onDone);
  }

  /** Annuls a sale (CEO); the reason is required. */
  cancelSale(id: number, reason: string, onDone: (result: StockChangeResult) => void): void {
    const clean = reason.trim();
    if (!clean) { this.errorSignal.set('missing-reason'); return; }
    this.changeSale(this.api.cancelSale(id, clean), onDone);
  }

  clearError(): void { this.errorSignal.set(null); }

  private changeSale(request$: Observable<StockChangeResult>, onDone: (result: StockChangeResult) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.subscribe({
      next: result => {
        this.quotesSignal.update(list => list.map(q => q.id === result.quote.id ? result.quote : q));
        if (this.currentSignal()?.id === result.quote.id) this.currentSignal.set(result.quote);
        this.savingSignal.set(false);
        onDone(result);
      },
      error: (e: unknown) => {
        this.savingSignal.set(false);
        this.errorSignal.set(saleError(e));
      }
    });
  }
}

/** Prices changed meanwhile (422), the CEO lowered the maximum discount, or the quote was sold meanwhile. */
function saveError(e: unknown): SavedQuotesError {
  if (!(e instanceof HttpErrorResponse)) return 'save';
  if (e.status === 422) return 'totals-mismatch';
  if (e.error?.code === 'sold') return 'sold';
  return e.error?.code === 'discount-too-high' ? 'discount-too-high' : 'save';
}

/** Someone sold or annulled it meanwhile, or the stock changed since the dialog was opened. */
function saleError(e: unknown): SavedQuotesError {
  const code = e instanceof HttpErrorResponse ? e.error?.code : null;
  if (code === 'sold' || code === 'not-sold') return 'sold';
  if (code === 'stock-problem') return 'stock-changed';
  if (code === 'missing-reason') return 'missing-reason';
  return 'sale';
}
