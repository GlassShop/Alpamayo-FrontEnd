import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {IamStore} from '../../iam/application/iam.store';
import {SavedQuote} from '../domain/model/saved-quote.entity';
import {SellQuoteDialog, SellQuoteDialogData} from './components/sell-quote-dialog/sell-quote-dialog';
import {CancelSaleDialog, CancelSaleDialogData} from './components/cancel-sale-dialog/cancel-sale-dialog';

/**
 * What the signed-in user may do with a saved quote, and the dialogs to do
 * it, shared by the saved quotes list and the print view.
 */
@Injectable({providedIn: 'root'})
export class QuoteActions {
  private readonly iam = inject(IamStore);
  private readonly dialog = inject(MatDialog);

  /** Its author or whoever sees every quote (the CEO). */
  private isMine(quote: SavedQuote): boolean {
    return this.iam.currentUser()?.id === quote.seller.id || this.iam.can('quotes.view-all');
  }

  /** A sold quote cannot be edited. */
  canEdit(quote: SavedQuote): boolean { return quote.status !== 'SOLD'; }

  canSell(quote: SavedQuote): boolean { return quote.status === 'OPEN' && this.isMine(quote); }

  canCancelSale(quote: SavedQuote): boolean { return quote.status === 'SOLD' && this.iam.can('sales.cancel'); }

  sell(quote: SavedQuote): void {
    this.dialog.open<SellQuoteDialog, SellQuoteDialogData>(SellQuoteDialog, {
      data: {quote}, width: '720px', maxWidth: 'calc(100vw - 32px)', autoFocus: '#sell-site', panelClass: 'al-dialog'
    });
  }

  cancelSale(quote: SavedQuote): void {
    this.dialog.open<CancelSaleDialog, CancelSaleDialogData>(CancelSaleDialog, {
      data: {quote}, width: '520px', maxWidth: 'calc(100vw - 32px)', autoFocus: '#cs-reason', panelClass: 'al-dialog'
    });
  }
}
