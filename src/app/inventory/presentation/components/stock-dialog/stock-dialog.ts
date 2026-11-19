import {Component, computed, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryStore} from '../../../application/inventory.store';
import {InventoryRows} from '../../inventory-rows';
import {MAX_MOVEMENT_REASON} from '../../../infrastructure/inventory-api';
import {isValidAdjustment, isValidQuantity, unitsFromPacks} from '../../../domain/services/stock-rules';

export interface StockDialogData {
  itemId: number;
  siteId: number;
}

/** COUNT: type the real quantity. IN / OUT: units that came in or went out. */
type StockMode = 'COUNT' | 'IN' | 'OUT';

/**
 * Records what happened to the stock of one item in one site — a count, an
 * entry or an exit, with its reason — and marks "en camino" or notes.
 */
@Component({
  selector: 'app-stock-dialog',
  imports: [MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './stock-dialog.html',
  styleUrl: './stock-dialog.css'
})
export class StockDialog {
  private readonly data = inject<StockDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StockDialog>);
  readonly inventory = inject(InventoryStore);
  private readonly rows = inject(InventoryRows);

  readonly maxReason = MAX_MOVEMENT_REASON;
  readonly modes: readonly StockMode[] = ['COUNT', 'IN', 'OUT'];

  readonly row = computed(() => this.rows.row(this.data.itemId));
  readonly siteId = signal(this.data.siteId);
  readonly mode = signal<StockMode>('IN');
  readonly quantity = signal<number | null>(null);
  readonly packs = signal<number | null>(null);
  readonly reason = signal('');
  readonly inTransit = signal(this.inventory.levelFor(this.data.itemId, this.data.siteId)?.inTransit ?? false);
  readonly notes = signal(this.inventory.levelFor(this.data.itemId, this.data.siteId)?.notes ?? '');
  readonly submitted = signal(false);

  readonly current = computed(() => this.inventory.quantityAt(this.data.itemId, this.siteId()));
  readonly item = computed(() => this.inventory.item(this.data.itemId));
  /** Entries can be typed in packs when the item knows how many units a pack holds. */
  readonly packSize = computed(() => this.item()?.unitsPerPack ?? null);

  /** Units the movement uses: typed directly, or packs × units per pack for an entry. */
  readonly units = computed(() => {
    const packs = this.packs();
    const size = this.packSize();
    if (this.mode() === 'IN' && packs !== null && size !== null && isValidQuantity(packs)) return unitsFromPacks(packs, size);
    return this.quantity();
  });

  /** Quantity left after the movement, for the preview. */
  readonly after = computed(() => {
    const units = this.units();
    if (units === null) return null;
    if (this.mode() === 'COUNT') return units;
    return (this.current() ?? 0) + (this.mode() === 'IN' ? units : -units);
  });

  readonly problem = computed(() => {
    const units = this.units();
    if (units === null) return null;
    if (this.mode() === 'COUNT') return isValidQuantity(units) ? null : 'inventory.error.invalid-quantity';
    const delta = this.mode() === 'IN' ? units : -units;
    return units > 0 && isValidAdjustment(this.current(), delta) ? null : 'inventory.error.invalid-adjustment';
  });

  readonly flagsChanged = computed(() => {
    const level = this.inventory.levelFor(this.data.itemId, this.siteId());
    return (level?.inTransit ?? false) !== this.inTransit() || (level?.notes ?? '') !== this.notes().trim();
  });

  readonly canSave = computed(() => (this.units() !== null && !this.problem()) || (this.units() === null && this.flagsChanged()));

  onSite(event: Event): void {
    const siteId = Number((event.target as HTMLSelectElement).value);
    this.siteId.set(siteId);
    const level = this.inventory.levelFor(this.data.itemId, siteId);
    this.inTransit.set(level?.inTransit ?? false);
    this.notes.set(level?.notes ?? '');
  }

  setMode(mode: StockMode): void {
    this.mode.set(mode);
    if (mode !== 'IN') this.packs.set(null);
  }

  onNumber(target: 'quantity' | 'packs', event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = field.value === '' ? null : field.valueAsNumber;
    this[target].set(value === null || Number.isNaN(value) ? null : value);
    if (target === 'packs' && value !== null) this.quantity.set(null);
  }

  text(target: 'reason' | 'notes', event: Event): void {
    this[target].set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  save(): void {
    this.submitted.set(true);
    if (!this.canSave()) return;
    const units = this.units();
    const movement = units === null ? undefined
      : this.mode() === 'COUNT' ? {kind: 'COUNT' as const, quantity: units}
      : {kind: 'ADJUSTMENT' as const, quantity: this.mode() === 'IN' ? units : -units};
    this.inventory.clearError();
    this.inventory.recordStock(this.data.itemId, this.siteId(), {
      movement, reason: this.reason().trim() || undefined, inTransit: this.inTransit(), notes: this.notes()
    });
    // Validation errors are set at once and keep the dialog open; a failed request shows on the page.
    if (!this.inventory.error()) this.dialogRef.close(true);
  }
}
