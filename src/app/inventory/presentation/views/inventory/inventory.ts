import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe, NgComponentOutlet} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryStore} from '../../../application/inventory.store';
import {StockMovementsStore} from '../../../application/stock-movements.store';
import {CatalogStore} from '../../../../catalog/application/catalog.store';
import {ProductsStore} from '../../../../catalog/application/products.store';
import {CatalogTab, catalogTabs} from '../../../../catalog/presentation/catalog-tabs';
import {TabBar} from '../../../../shared/presentation/components/tab-bar/tab-bar';
import {InventoryRows, matchesSearch} from '../../inventory-rows';
import {StockDialog, StockDialogData} from '../../components/stock-dialog/stock-dialog';
import {ItemDialog, ItemDialogData} from '../../components/item-dialog/item-dialog';
import {MovementsPanel} from '../../components/movements-panel/movements-panel';
import {INVENTORY_COSTS} from '../../../application/inventory-costs';
import {IamStore} from '../../../../iam/application/iam.store';

/**
 * ALL; items to buy again (out of stock or at the minimum); never counted; on their way.
 * The CEO also filters by cost: margin below the minimum, or stock without a costed purchase.
 */
type StockFilter = 'ALL' | 'TO_BUY' | 'UNKNOWN' | 'IN_TRANSIT' | 'LOW_MARGIN' | 'NO_COST';

const PAGE_SIZE = 60;

/**
 * Stock of every item in every site, for every role: see it by category,
 * search it, find what must be bought again, record counts, entries and
 * exits, and add or edit items. The CEO also sees the cost and margin of
 * each item when the purchasing context provides INVENTORY_COSTS; nobody
 * else gets amounts (the API removes them too).
 */
@Component({
  selector: 'app-inventory',
  imports: [DecimalPipe, NgComponentOutlet, TranslatePipe, MatIconModule, MatTooltipModule, TabBar, MovementsPanel],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  readonly inventory = inject(InventoryStore);
  readonly movements = inject(StockMovementsStore);
  readonly rowsService = inject(InventoryRows);
  private readonly catalog = inject(CatalogStore);
  private readonly products = inject(ProductsStore);
  private readonly dialog = inject(MatDialog);
  private readonly iam = inject(IamStore);
  private readonly costSource = inject(INVENTORY_COSTS, {optional: true});

  /** Cost columns, filters and summary: CEO only, and only where costs are provided. */
  readonly costs = this.iam.can('costs.manage') ? this.costSource : null;
  readonly filters: readonly StockFilter[] = this.costs
    ? ['ALL', 'TO_BUY', 'UNKNOWN', 'IN_TRANSIT', 'LOW_MARGIN', 'NO_COST']
    : ['ALL', 'TO_BUY', 'UNKNOWN', 'IN_TRANSIT'];
  readonly tab = signal<CatalogTab>('GLASS');
  readonly filter = signal<StockFilter>('ALL');
  readonly search = signal('');
  /** Site whose column is shown, or null for every site. */
  readonly siteId = signal<number | null>(null);
  readonly limit = signal(PAGE_SIZE);

  /** Each tab shows how many of its items must be bought again. */
  readonly tabs = computed(() => {
    const rows = this.rowsService.rows();
    return catalogTabs(tab => rows.filter(r => r.category === tab && r.toBuy).length || null);
  });

  readonly sites = computed(() => {
    const id = this.siteId();
    return this.inventory.sites().filter(s => id === null || s.id === id);
  });

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();
    const site = this.siteId();
    return this.rowsService.rows().filter(row => {
      if (row.category !== this.tab()) return false;
      if (term && !matchesSearch(row, term)) return false;
      const stock = row.stock.filter(s => site === null || s.siteId === site);
      if (filter === 'TO_BUY') return stock.some(s => s.status === 'OUT' || s.status === 'LOW');
      if (filter === 'UNKNOWN') return stock.some(s => s.status === 'UNKNOWN');
      if (filter === 'IN_TRANSIT') return stock.some(s => s.inTransit);
      if (filter === 'LOW_MARGIN') return !!this.costs?.costOf(row.item.id)?.lowMargin;
      if (filter === 'NO_COST') return (row.total ?? 0) > 0 && this.costs?.costOf(row.item.id)?.last == null;
      return true;
    });
  });
  readonly rows = computed(() => this.filtered().slice(0, this.limit()));

  readonly error = computed(() => this.inventory.error() ?? this.products.error() ?? this.catalog.error());

  constructor() {
    effect(() => {
      this.tab(); this.filter(); this.search(); this.siteId();
      this.limit.set(PAGE_SIZE);
    });
  }

  ngOnInit(): void {
    this.rowsService.ensureLoaded();
    this.movements.showFor(null);
    this.movements.load();
    this.costs?.ensureLoaded();
  }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }

  onSite(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.siteId.set(value ? Number(value) : null);
    this.movements.siteId.set(value ? Number(value) : null);
  }

  onFilter(event: Event): void { this.filter.set((event.target as HTMLSelectElement).value as StockFilter); }

  showMore(): void { this.limit.update(n => n + PAGE_SIZE); }

  retry(): void {
    this.inventory.load();
    this.products.load();
    this.catalog.load();
  }

  clearError(): void {
    this.inventory.clearError();
    this.products.clearError();
    this.catalog.clearError();
  }

  openStock(itemId: number, siteId: number): void {
    this.dialog.open<StockDialog, StockDialogData>(StockDialog, {
      data: {itemId, siteId}, width: '560px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog'
    });
  }

  openNewItem(): void {
    this.dialog.open<ItemDialog, ItemDialogData>(ItemDialog, {
      data: {mode: 'create', category: this.tab()}, width: '600px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog'
    });
  }

  openEditItem(itemId: number): void {
    this.dialog.open<ItemDialog, ItemDialogData>(ItemDialog, {
      data: {mode: 'edit', itemId}, width: '600px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog'
    });
  }

  showMovements(itemId: number): void {
    this.movements.showFor(itemId);
    globalThis.document?.getElementById('stock-movements')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  statusClass(status: string): string {
    return status === 'OUT' ? 'al-pill--danger' : status === 'LOW' ? 'al-pill--warning' : 'al-pill--success';
  }
}
