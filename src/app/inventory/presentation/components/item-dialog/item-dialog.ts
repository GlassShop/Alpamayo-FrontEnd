import {Component, computed, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryStore, ItemDetails} from '../../../application/inventory.store';
import {CatalogStore} from '../../../../catalog/application/catalog.store';
import {ProductsStore} from '../../../../catalog/application/products.store';
import {glassTypeLabel} from '../../../../catalog/domain/model/glass-type.entity';
import {productLabel} from '../../../../catalog/domain/model/product.entity';
import {CatalogTab} from '../../../../catalog/presentation/catalog-tabs';
import {PACK_KINDS, PackKind} from '../../../domain/model/inventory-item.entity';
import {InventoryRows} from '../../inventory-rows';

export type ItemDialogData = {mode: 'create'; category: CatalogTab} | {mode: 'edit'; itemId: number};

/** Products listed at once in the picker; the search narrows long categories. */
const PICKER_SIZE = 80;

/**
 * Adds an inventory item (a product or glass type in one colour or size,
 * with the units counted in each site) or changes the details of one.
 */
@Component({
  selector: 'app-item-dialog',
  imports: [MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './item-dialog.html',
  styleUrl: './item-dialog.css'
})
export class ItemDialog {
  readonly data = inject<ItemDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ItemDialog>);
  readonly inventory = inject(InventoryStore);
  private readonly catalog = inject(CatalogStore);
  private readonly products = inject(ProductsStore);
  private readonly rows = inject(InventoryRows);

  readonly packKinds = PACK_KINDS;
  readonly creating = this.data.mode === 'create';
  private readonly existing = this.data.mode === 'edit' ? this.inventory.item(this.data.itemId) : undefined;
  readonly category: CatalogTab = this.data.mode === 'create'
    ? this.data.category : this.rows.row(this.data.itemId)?.category ?? 'OTHER';
  readonly isGlass = this.category === 'GLASS';
  /** Glass and other sheets have a size; aluminium and accessories do not. */
  readonly hasSize = this.isGlass || this.category === 'OTHER';
  readonly title = this.creating ? 'inventory.item.new' : 'inventory.item.edit';
  readonly editingName = this.data.mode === 'edit' ? this.rows.row(this.data.itemId)?.name ?? '' : '';

  readonly search = signal('');
  readonly targetId = signal<number | null>(null);
  readonly color = signal(this.existing?.color ?? '');
  readonly sku = signal(this.existing?.sku ?? '');
  readonly widthCm = signal<number | null>(this.existing?.widthCm ?? null);
  readonly heightCm = signal<number | null>(this.existing?.heightCm ?? null);
  readonly packKind = signal<PackKind | null>(this.existing?.packKind ?? null);
  readonly unitsPerPack = signal<number | null>(this.existing?.unitsPerPack ?? null);
  readonly minStock = signal<number | null>(this.existing?.minStock ?? null);
  readonly initial = signal<Record<number, number | null>>({});
  readonly submitted = signal(false);

  /** Glass types or products of the category the item can belong to. */
  readonly options = computed(() => {
    const term = this.search().trim().toLowerCase();
    const all = this.isGlass
      ? this.catalog.glassTypes().map(g => ({id: g.id, label: glassTypeLabel(g)}))
      : this.products.byCategory(this.category as Exclude<CatalogTab, 'GLASS'>).map(p => ({
        id: p.id, label: p.seriesId ? `${productLabel(p)} · ${this.products.seriesName(p.seriesId)}` : productLabel(p)
      }));
    return all.filter(o => !term || o.label.toLowerCase().includes(term)).sort((a, b) => a.label.localeCompare(b.label, 'es', {numeric: true}));
  });
  readonly shownOptions = computed(() => this.options().slice(0, PICKER_SIZE));

  /** Colours already used in the category, offered while typing. */
  readonly knownColors = computed(() => [...new Set(this.rows.rows()
    .filter(r => r.category === this.category && r.item.color).map(r => r.item.color))].sort((a, b) => a.localeCompare(b, 'es')));

  readonly details = computed<ItemDetails>(() => ({
    color: this.color(), sku: this.sku(),
    widthCm: this.hasSize ? this.widthCm() : null, heightCm: this.hasSize ? this.heightCm() : null,
    packKind: this.packKind(), unitsPerPack: this.packKind() === null ? null : this.unitsPerPack(),
    minStock: this.minStock()
  }));

  readonly missingTarget = computed(() => this.creating && this.targetId() === null);

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }

  onTarget(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.targetId.set(value ? Number(value) : null);
  }

  onText(target: 'color' | 'sku', event: Event): void { this[target].set((event.target as HTMLInputElement).value); }

  onNumber(target: 'widthCm' | 'heightCm' | 'unitsPerPack' | 'minStock', event: Event): void {
    const field = event.target as HTMLInputElement;
    this[target].set(field.value === '' || Number.isNaN(field.valueAsNumber) ? null : field.valueAsNumber);
  }

  onPack(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PackKind | '';
    this.packKind.set(value || null);
  }

  onInitial(siteId: number, event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = field.value === '' || Number.isNaN(field.valueAsNumber) ? null : field.valueAsNumber;
    this.initial.update(map => ({...map, [siteId]: value}));
  }

  /** Validation error of the last attempt, shown inside the dialog (it stays open). */
  readonly problem = signal<string | null>(null);

  save(): void {
    this.submitted.set(true);
    this.inventory.clearError();
    if (this.data.mode === 'edit') {
      this.inventory.updateItem(this.data.itemId, this.details());
    } else {
      const target = this.targetId();
      if (target === null) return;
      const initialCounts = Object.entries(this.initial())
        .filter((entry): entry is [string, number] => entry[1] !== null)
        .map(([siteId, quantity]) => ({siteId: Number(siteId), quantity}));
      this.inventory.createItem({
        ...this.details(), glassTypeId: this.isGlass ? target : null, productId: this.isGlass ? null : target, initialCounts
      });
    }
    // Validation errors are set at once; a failed request is shown on the page after closing.
    const error = this.inventory.error();
    this.problem.set(error);
    if (!error) this.dialogRef.close(true);
  }
}
