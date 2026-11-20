import {Component, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {SavedQuotesStore} from '../../../application/saved-quotes.store';
import {SavedQuote} from '../../../domain/model/saved-quote.entity';

export interface CancelSaleDialogData {
  quote: SavedQuote;
}

/** Max length of the reason, as the API keeps it. */
export const MAX_CANCEL_REASON = 200;

/**
 * Annuls a sale (CEO only). The reason is required; the units go back to the
 * site they left from and the quote is open again.
 */
@Component({
  selector: 'app-cancel-sale-dialog',
  imports: [DatePipe, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './cancel-sale-dialog.html',
  styleUrl: './cancel-sale-dialog.css'
})
export class CancelSaleDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CancelSaleDialog>);
  readonly quote = inject<CancelSaleDialogData>(MAT_DIALOG_DATA).quote;
  readonly store = inject(SavedQuotesStore);
  private readonly inventory = inject(InventoryStore);

  readonly maxReason = MAX_CANCEL_REASON;
  readonly reason = signal('');
  readonly submitted = signal(false);

  ngOnInit(): void { this.store.clearError(); }

  onReason(event: Event): void { this.reason.set((event.target as HTMLTextAreaElement).value); }

  confirm(): void {
    this.submitted.set(true);
    if (!this.reason().trim()) return;
    this.store.cancelSale(this.quote.id, this.reason(), result => {
      // The inventory may not be loaded yet; it will read the new levels when it is.
      if (this.inventory.loaded()) this.inventory.applyRecordedLevels(result.levels);
      this.dialogRef.close(true);
    });
  }
}
