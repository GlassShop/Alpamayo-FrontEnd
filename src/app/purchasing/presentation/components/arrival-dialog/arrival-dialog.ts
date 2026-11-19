import {Component, computed, inject, signal} from '@angular/core';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {PurchasesStore} from '../../../application/purchases.store';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {InventoryRow, InventoryRows, matchesSearch} from '../../../../inventory/presentation/inventory-rows';
import {unitsFromPacks} from '../../../../inventory/domain/services/stock-rules';
import {PACK_KINDS, PackKind} from '../../../../inventory/domain/model/inventory-item.entity';
import {CatalogTab} from '../../../../catalog/presentation/catalog-tabs';

interface DraftLine {
  row: InventoryRow;
  quantity: number | null;
  packs: number | null;
  packKind: PackKind;
  unitsPerPack: number | null;
}

/** Usual pack of each category, offered when the item has none saved yet. */
const DEFAULT_PACK: Record<CatalogTab, PackKind> = {
  GLASS: 'CRATE', ALUMINUM_SERIES: 'BUNDLE', ALUMINUM_TRADITIONAL: 'BUNDLE', ACCESSORY: 'BOX', OTHER: 'BOX'
};

const wholePositive = (value: number | null): value is number => value !== null && Number.isInteger(value) && value >= 1;

/** Items listed at once in the search; typing narrows the list. */
const SEARCH_SIZE = 12;

/** Today in the browser's time zone, as YYYY-MM-DD. */
function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Registers goods that arrived at one site: supplier, date and what came,
 * in units or in packs (crates, bundles, boxes). The stock goes up when it
 * is saved; the CEO types the costs afterwards.
 */
@Component({
  selector: 'app-arrival-dialog',
  imports: [MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './arrival-dialog.html',
  styleUrl: './arrival-dialog.css'
})
export class ArrivalDialog {
  private readonly dialogRef = inject(MatDialogRef<ArrivalDialog>);
  readonly purchases = inject(PurchasesStore);
  readonly inventory = inject(InventoryStore);
  private readonly rows = inject(InventoryRows);

  readonly date = signal(today());
  readonly supplier = signal('');
  readonly siteId = signal<number | null>(this.inventory.sites()[0]?.id ?? null);
  readonly notes = signal('');
  readonly search = signal('');
  readonly lines = signal<DraftLine[]>([]);
  readonly problem = signal<string | null>(null);
  readonly packKinds = PACK_KINDS;

  readonly results = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (term.length < 2) return [];
    const chosen = new Set(this.lines().map(l => l.row.item.id));
    return this.rows.rows().filter(r => !chosen.has(r.item.id) && matchesSearch(r, term)).slice(0, SEARCH_SIZE);
  });

  readonly totalUnits = computed(() => this.lines().reduce((sum, l) => sum + (this.units(l) ?? 0), 0));

  /** True when the line is counted in packs (packs typed), so the units are worked out. */
  inPacks(line: DraftLine): boolean { return line.packs !== null; }

  /** Units of a line: typed directly, or packs × units per pack. */
  units(line: DraftLine): number | null {
    if (!this.inPacks(line)) return line.quantity;
    return wholePositive(line.packs) && wholePositive(line.unitsPerPack) ? unitsFromPacks(line.packs, line.unitsPerPack) : null;
  }

  text(target: 'date' | 'supplier' | 'notes' | 'search', event: Event): void {
    this[target].set((event.target as HTMLInputElement).value);
  }

  onSite(event: Event): void { this.siteId.set(Number((event.target as HTMLSelectElement).value)); }

  add(row: InventoryRow): void {
    const {packKind, unitsPerPack} = row.item;
    this.lines.update(list => [...list, {row, quantity: null, packs: null,
      packKind: packKind ?? DEFAULT_PACK[row.category], unitsPerPack: unitsPerPack ?? null}]);
    this.search.set('');
  }

  remove(itemId: number): void {
    this.lines.update(list => list.filter(l => l.row.item.id !== itemId));
  }

  onNumber(itemId: number, field: 'quantity' | 'packs' | 'unitsPerPack', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' || Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber;
    this.update(itemId, l => field === 'packs' ? {...l, packs: value, quantity: null}
      : field === 'quantity' ? {...l, quantity: value, packs: null} : {...l, unitsPerPack: value});
  }

  onPackKind(itemId: number, event: Event): void {
    const packKind = (event.target as HTMLSelectElement).value as PackKind;
    this.update(itemId, l => ({...l, packKind}));
  }

  save(): void {
    const siteId = this.siteId();
    if (siteId === null) return;
    const draft = this.lines();
    if (draft.some(l => this.inPacks(l) && (!wholePositive(l.packs) || !wholePositive(l.unitsPerPack)))) {
      this.problem.set('purchases.error.invalid-pack');
      return;
    }
    const lines = draft.map(l => ({itemId: l.row.item.id, quantity: this.units(l) ?? 0, packs: l.packs}));
    this.purchases.clearError();
    this.purchases.registerArrival({date: this.date(), supplier: this.supplier(), siteId, notes: this.notes(), lines});
    // Validation errors are set at once and keep the dialog open; a failed request shows on the page.
    const error = this.purchases.error();
    this.problem.set(error);
    if (error) return;
    this.rememberPacks(draft);
    this.dialogRef.close(true);
  }

  /** Saves on the item the pack used in this arrival, so next time only the number of packs is typed. */
  private rememberPacks(draft: readonly DraftLine[]): void {
    for (const line of draft) {
      const item = line.row.item;
      if (!this.inPacks(line) || (item.packKind === line.packKind && item.unitsPerPack === line.unitsPerPack)) continue;
      this.inventory.updateItem(item.id, {
        color: item.color, sku: item.sku, widthCm: item.widthCm, heightCm: item.heightCm, minStock: item.minStock,
        packKind: line.packKind, unitsPerPack: line.unitsPerPack
      });
    }
  }

  private update(itemId: number, change: (line: DraftLine) => DraftLine): void {
    this.lines.update(list => list.map(l => l.row.item.id === itemId ? change(l) : l));
  }
}
