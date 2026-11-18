import {inject, Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {DocumentHolder, DocumentLookupApi} from '../infrastructure/document-lookup-api';
import {DocType, isValidDocument} from '../domain/model/document-id';

export type LookupStatus = 'idle' | 'searching' | 'found' | 'not-found' | 'error';

/**
 * Looks up a customer by DNI or RUC. "not-found" lets the view switch to
 * manual entry; "error" means the lookup service is unavailable (the seller
 * can still type the data by hand).
 */
@Injectable({providedIn: 'root'})
export class CustomerLookupStore {
  private readonly api = inject(DocumentLookupApi);
  private request?: Subscription;

  private readonly statusSignal = signal<LookupStatus>('idle');
  private readonly holderSignal = signal<DocumentHolder | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly holder = this.holderSignal.asReadonly();

  /** Searches only valid documents; a newer search cancels the previous one. */
  lookup(type: DocType, number: string): void {
    this.request?.unsubscribe();
    this.holderSignal.set(null);
    if (!isValidDocument(type, number)) { this.statusSignal.set('idle'); return; }
    this.statusSignal.set('searching');
    this.request = this.api.find(type, number).subscribe({
      next: holder => { this.holderSignal.set(holder); this.statusSignal.set('found'); },
      error: (e: unknown) => this.statusSignal.set(e instanceof HttpErrorResponse && e.status === 404 ? 'not-found' : 'error')
    });
  }

  reset(): void {
    this.request?.unsubscribe();
    this.statusSignal.set('idle');
    this.holderSignal.set(null);
  }
}
