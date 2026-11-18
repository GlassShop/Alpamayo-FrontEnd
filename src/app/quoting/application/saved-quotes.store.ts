import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {QuotesApi} from '../infrastructure/quotes-api';
import {QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';
import {isValidDocument} from '../domain/model/document-id';

/** Why saving or loading failed. Values are translation key suffixes. */
export type SavedQuotesError =
  | 'load' | 'not-found' | 'save' | 'incomplete'
  | 'invalid-document' | 'missing-name' | 'invalid-advance' | 'terms-not-accepted' | 'totals-mismatch';

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

  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  /** Quote opened in the print view. */
  readonly current = this.currentSignal.asReadonly();

  /** Newest first, filtered by the search text and the seller filter. */
  readonly quotes = computed(() => {
    const q = fold(this.search().trim());
    const seller = this.sellerFilter();
    return [...this.quotesSignal()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter(quote => seller === null || quote.seller.id === seller)
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
        this.errorSignal.set(e instanceof HttpErrorResponse && e.status === 422 ? 'totals-mismatch' : 'save');
      }
    });
  }

  clearError(): void { this.errorSignal.set(null); }
}
