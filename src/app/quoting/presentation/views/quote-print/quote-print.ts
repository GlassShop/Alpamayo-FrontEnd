import {Component, computed, inject, OnInit} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {SavedQuotesStore} from '../../../application/saved-quotes.store';
import {QuotingStore} from '../../../application/quoting.store';
import {CatalogStore} from '../../../../catalog/application/catalog.store';
import {COMPANY_PROFILE} from '../../../../shared/domain/model/company-profile';

/**
 * Printable quote for the customer. "Imprimir / Guardar PDF" uses the
 * browser's print dialog, where "Save as PDF" produces the file to send.
 * Shows the frozen prices of the saved quote, never current catalog prices.
 */
@Component({
  selector: 'app-quote-print',
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, MatIconModule],
  templateUrl: './quote-print.html',
  styleUrl: './quote-print.css'
})
export class QuotePrint implements OnInit {
  readonly store = inject(SavedQuotesStore);
  private readonly quoting = inject(QuotingStore);
  private readonly catalog = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly company = COMPANY_PROFILE;

  /** Last day the quote is valid. */
  readonly validUntil = computed(() => {
    const quote = this.store.current();
    if (!quote) return null;
    const date = new Date(quote.createdAt);
    date.setDate(date.getDate() + this.company.quoteValidityDays);
    return date;
  });

  ngOnInit(): void {
    this.store.open(Number(this.route.snapshot.paramMap.get('id')));
    this.catalog.ensureLoaded();
  }

  print(): void { globalThis.print?.(); }

  edit(): void {
    const quote = this.store.current();
    if (!quote) return;
    this.quoting.loadForEditing(quote);
    this.router.navigate(['/cotizador']).then();
  }
}
