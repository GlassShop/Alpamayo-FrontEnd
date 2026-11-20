import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {InventoryItem, itemSize} from '../../../../inventory/domain/model/inventory-item.entity';
import {SavedQuotesStore} from '../../../application/saved-quotes.store';
import {SavedQuote} from '../../../domain/model/saved-quote.entity';
import {canSell, planSale, toSaleLines} from '../../../domain/services/sale-plan';

export interface SellQuoteDialogData {
  quote: SavedQuote;
}

/**
 * Marks a saved quote as sold: one site, and for every product line the
 * inventory item it takes units from, with the stock before and after.
 * Anything missing (no item, never counted, not enough) blocks the sale and
 * says what to fix in the inventory. Glass and extra concepts do not touch
 * the stock.
 */
@Component({
  selector: 'app-sell-quote-dialog',
  imports: [DecimalPipe, RouterLink, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './sell-quote-dialog.html',
  styleUrl: './sell-quote-dialog.css'
})
export class SellQuoteDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SellQuoteDialog>);
  readonly quote = inject<SellQuoteDialogData>(MAT_DIALOG_DATA).quote;
  readonly inventory = inject(InventoryStore);
  readonly store = inject(SavedQuotesStore);

  readonly siteId = signal<number | null>(null);
  /** Item chosen for lines that several items fit, by product index. */
  readonly chosen = signal<ReadonlyMap<number, number>>(new Map());

  readonly plan = computed(() => {
    const siteId = this.siteId();
    if (siteId === null || !this.inventory.loaded()) return [];
    return planSale(this.quote.products, siteId, this.inventory.items(),
      (itemId, site) => this.inventory.quantityAt(itemId, site), this.chosen());
  });
  readonly ready = computed(() => this.inventory.loaded() && this.siteId() !== null);
  readonly sellable = computed(() => this.ready() && canSell(this.plan()));
  readonly problems = computed(() => this.plan().filter(l => l.problem !== null).length);
  /** Glass lines and extra concepts are listed as "no stock". */
  readonly untracked = this.quote.lines.length + this.quote.extras.length;

  constructor() {
    // Default to the first site once the inventory arrives.
    effect(() => {
      const first = this.inventory.sites()[0];
      if (this.siteId() === null && first) this.siteId.set(first.id);
    });
  }

  ngOnInit(): void {
    this.store.clearError();
    this.inventory.ensureLoaded();
  }

  onSite(event: Event): void { this.siteId.set(Number((event.target as HTMLSelectElement).value)); }

  onItem(productIndex: number, event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.chosen.update(map => new Map(map).set(productIndex, value));
  }

  /** "330 × 214 cm", the code, or the colour, to tell items apart. */
  itemLabel(item: Pick<InventoryItem, 'id'>): string {
    const full = this.inventory.item(item.id);
    if (!full) return `#${item.id}`;
    return itemSize(full) || full.sku || full.color || `#${full.id}`;
  }

  confirm(): void {
    const siteId = this.siteId();
    if (!this.sellable() || siteId === null) return;
    this.store.sell(this.quote.id, {siteId, lines: toSaleLines(this.plan())}, result => {
      this.inventory.applyRecordedLevels(result.levels);
      this.dialogRef.close(true);
    });
  }
}
