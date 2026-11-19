import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {PurchasesStore} from '../../../application/purchases.store';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {InventoryRows} from '../../../../inventory/presentation/inventory-rows';
import {IamStore} from '../../../../iam/application/iam.store';
import {PurchaseStatus, purchaseTotal, purchaseUnits} from '../../../domain/model/purchase.entity';
import {ArrivalDialog} from '../../components/arrival-dialog/arrival-dialog';
import {PurchaseDialog, PurchaseDialogData} from '../../components/purchase-dialog/purchase-dialog';

type StatusFilter = 'ALL' | PurchaseStatus;

/**
 * Purchases for every role: register what arrived (the stock goes up) and
 * see past arrivals without amounts. The CEO also sees the landed total and
 * types the costs of the purchases still pending.
 */
@Component({
  selector: 'app-purchases',
  imports: [DatePipe, DecimalPipe, MatIconModule, TranslatePipe],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css'
})
export class Purchases implements OnInit {
  readonly purchases = inject(PurchasesStore);
  readonly inventory = inject(InventoryStore);
  private readonly rows = inject(InventoryRows);
  private readonly dialog = inject(MatDialog);
  private readonly iam = inject(IamStore);

  readonly canCost = this.iam.can('costs.manage');
  readonly filters: readonly StatusFilter[] = ['ALL', 'PENDING_COST', 'COSTED'];
  readonly filter = signal<StatusFilter>('ALL');
  readonly search = signal('');
  readonly units = purchaseUnits;
  readonly total = purchaseTotal;

  readonly ready = computed(() => this.purchases.loaded() && this.rows.ready());
  readonly error = computed(() => this.purchases.error() ?? this.inventory.error());
  private readonly siteNames = computed(() => new Map(this.inventory.sites().map(s => [s.id, s.name])));

  readonly list = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();
    return this.purchases.purchases().filter(p => (filter === 'ALL' || p.status === filter)
      && (!term || p.supplier.toLowerCase().includes(term)));
  });

  ngOnInit(): void {
    this.rows.ensureLoaded();
    this.purchases.ensureLoaded();
  }

  siteName(siteId: number): string { return this.siteNames().get(siteId) ?? `#${siteId}`; }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }
  onFilter(event: Event): void { this.filter.set((event.target as HTMLSelectElement).value as StatusFilter); }

  retry(): void {
    this.purchases.load();
    this.rows.ensureLoaded();
  }

  clearError(): void {
    this.purchases.clearError();
    this.inventory.clearError();
  }

  openArrival(): void {
    this.dialog.open(ArrivalDialog, {width: '760px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog', autoFocus: 'input'});
  }

  openPurchase(purchaseId: number): void {
    this.dialog.open<PurchaseDialog, PurchaseDialogData>(PurchaseDialog, {
      data: {purchaseId}, width: this.canCost ? '980px' : '640px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog'
    });
  }
}
