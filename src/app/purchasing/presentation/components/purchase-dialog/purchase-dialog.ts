import {Component, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {PurchasesStore} from '../../../application/purchases.store';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {InventoryRows} from '../../../../inventory/presentation/inventory-rows';
import {IamStore} from '../../../../iam/application/iam.store';
import {CostLineResult, CURRENCIES, Currency, landedCosts} from '../../../domain/services/landed-cost';
import {purchaseUnits} from '../../../domain/model/purchase.entity';

export interface PurchaseDialogData {
  purchaseId: number;
}

/**
 * One purchase: what arrived, where and who registered it. The CEO also
 * types the exchange rate, the dollar price of each line, the freight and
 * the Lima → Huaraz transport, and sees how they are shared by value and the
 * landed cost of each unit before saving.
 */
@Component({
  selector: 'app-purchase-dialog',
  imports: [DatePipe, DecimalPipe, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './purchase-dialog.html',
  styleUrl: './purchase-dialog.css'
})
export class PurchaseDialog {
  private readonly data = inject<PurchaseDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PurchaseDialog>);
  readonly purchases = inject(PurchasesStore);
  private readonly inventory = inject(InventoryStore);
  private readonly rows = inject(InventoryRows);
  private readonly iam = inject(IamStore);

  readonly currencies = CURRENCIES;
  readonly canCost = this.iam.can('costs.manage');
  readonly purchase = computed(() => this.purchases.purchase(this.data.purchaseId));
  readonly siteName = computed(() => this.inventory.sites().find(s => s.id === this.purchase()?.siteId)?.name ?? '');
  readonly units = computed(() => { const p = this.purchase(); return p ? purchaseUnits(p) : 0; });

  private readonly initial = this.purchases.purchase(this.data.purchaseId);
  readonly exchangeRate = signal<number | null>(this.initial?.costs?.exchangeRate ?? null);
  readonly freightAmount = signal<number | null>(this.initial?.costs?.freight.amount ?? 0);
  readonly freightCurrency = signal<Currency>(this.initial?.costs?.freight.currency ?? 'PEN');
  readonly transportAmount = signal<number | null>(this.initial?.costs?.transport.amount ?? 0);
  readonly transportCurrency = signal<Currency>(this.initial?.costs?.transport.currency ?? 'PEN');
  readonly prices = signal<(number | null)[]>(this.initial?.lines.map(l => l.unitPriceUsd) ?? []);
  readonly problem = signal<string | null>(null);

  readonly lineNames = computed(() => (this.purchase()?.lines ?? []).map(line => {
    const row = this.rows.row(line.itemId);
    return {name: row?.name ?? `#${line.itemId}`, variant: row?.variant ?? '', unit: row?.unit ?? 'UNIT'};
  }));

  /** Live preview of the landed cost while the CEO types; null until every value is valid. */
  readonly preview = computed<CostLineResult[] | null>(() => {
    const purchase = this.purchase();
    const rate = this.exchangeRate();
    const freight = this.freightAmount();
    const transport = this.transportAmount();
    const prices = this.prices();
    if (!purchase || !rate || rate <= 0 || freight === null || freight < 0 || transport === null || transport < 0) return null;
    if (prices.length !== purchase.lines.length || prices.some(p => p === null || !(p > 0))) return null;
    return landedCosts(
      purchase.lines.map((line, i) => ({quantity: line.quantity, unitPriceUsd: prices[i]!})), rate,
      {amount: freight, currency: this.freightCurrency()}, {amount: transport, currency: this.transportCurrency()}
    );
  });

  readonly previewTotal = computed(() => this.preview()?.reduce((sum, l) => sum + l.totalCost, 0) ?? null);

  onNumber(target: 'exchangeRate' | 'freightAmount' | 'transportAmount', event: Event): void {
    const input = event.target as HTMLInputElement;
    this[target].set(input.value === '' || Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber);
  }

  onCurrency(target: 'freightCurrency' | 'transportCurrency', event: Event): void {
    this[target].set((event.target as HTMLSelectElement).value as Currency);
  }

  onPrice(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' || Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber;
    this.prices.update(list => list.map((p, i) => i === index ? value : p));
  }

  save(): void {
    const purchase = this.purchase();
    if (!purchase || !this.preview()) { this.problem.set('purchases.error.invalid-costs'); return; }
    this.purchases.clearError();
    this.purchases.setCosts(purchase.id, {
      exchangeRate: this.exchangeRate()!,
      freight: {amount: this.freightAmount()!, currency: this.freightCurrency()},
      transport: {amount: this.transportAmount()!, currency: this.transportCurrency()},
      unitPricesUsd: this.prices().map(p => p!)
    });
    const error = this.purchases.error();
    this.problem.set(error);
    if (!error) this.dialogRef.close(true);
  }
}
