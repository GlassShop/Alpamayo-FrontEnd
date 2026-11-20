import {Component, inject, OnInit} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {SavedQuotesStore} from '../../../application/saved-quotes.store';
import {QuotingStore} from '../../../application/quoting.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {CatalogStore} from '../../../../catalog/application/catalog.store';
import {quoteDiscount, SavedQuote} from '../../../domain/model/saved-quote.entity';

/**
 * "Mis cotizaciones": each user sees their own saved quotes; the CEO sees
 * every quote, can filter by seller and sees how much was discounted.
 */
@Component({
  selector: 'app-saved-quotes',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './saved-quotes.html',
  styleUrl: './saved-quotes.css'
})
export class SavedQuotes implements OnInit {
  readonly store = inject(SavedQuotesStore);
  readonly iam = inject(IamStore);
  private readonly quoting = inject(QuotingStore);
  private readonly catalog = inject(CatalogStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  /** Soles taken off the catalog prices; shown to the CEO. */
  readonly discount = quoteDiscount;

  ngOnInit(): void {
    this.store.clearError();
    this.store.load();
    this.catalog.ensureLoaded();
  }

  onSearch(event: Event): void { this.store.search.set((event.target as HTMLInputElement).value); }

  onSeller(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.sellerFilter.set(value ? Number(value) : null);
  }

  /** Opens the quote in the quoter. Asks first if there is an unsaved quote in progress. */
  edit(quote: SavedQuote): void {
    const busy = this.quoting.rowCount() > 0 && this.quoting.editing()?.id !== quote.id;
    if (busy && !globalThis.confirm?.(this.translate.instant('quotes.list.confirm-replace'))) return;
    this.store.open(quote.id, full => {
      this.quoting.loadForEditing(full);
      this.router.navigate(['/cotizador']).then();
    });
  }
}
