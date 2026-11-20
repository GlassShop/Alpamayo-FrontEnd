import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {QuoteCart} from '../../catalog/application/quote-cart';
import {QuotingStore} from '../application/quoting.store';
import {AddProductDialog, AddProductDialogData} from './components/add-product-dialog/add-product-dialog';

export const QUOTER_PATH = '/cotizador';
/** `/cotizador?vidrio=5` opens the quoter with that glass type chosen. */
export const GLASS_PARAM = 'vidrio';

/** Lets the catalog add products to the quote being built (see {@link QuoteCart}). */
@Injectable()
export class QuoteCartAdapter implements QuoteCart {
  private readonly quoting = inject(QuotingStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly rowCount = this.quoting.rowCount;
  readonly total = this.quoting.total;

  addProduct(productId: number): void {
    this.dialog.open<AddProductDialog, AddProductDialogData>(AddProductDialog, {
      data: {productId}, width: '520px', maxWidth: 'calc(100vw - 32px)', autoFocus: '#ap-qty', panelClass: 'al-dialog'
    });
  }

  quoteGlass(glassTypeId: number): void {
    this.router.navigate([QUOTER_PATH], {queryParams: {[GLASS_PARAM]: glassTypeId}}).then();
  }

  open(): void {
    this.router.navigate([QUOTER_PATH]).then();
  }
}
