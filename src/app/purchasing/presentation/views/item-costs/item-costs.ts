import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CostAnalysisStore} from '../../../application/cost-analysis.store';
import {PurchasesStore} from '../../../application/purchases.store';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {InventoryRows, matchesSearch} from '../../../../inventory/presentation/inventory-rows';
import {CatalogTab, catalogTabs} from '../../../../catalog/presentation/catalog-tabs';
import {TabBar} from '../../../../shared/presentation/components/tab-bar/tab-bar';

/** Every item; items with a costed purchase; margin below the minimum; items with stock but no cost yet. */
type CostFilter = 'ALL' | 'WITH_COST' | 'LOW_MARGIN' | 'NO_COST';

const PAGE_SIZE = 60;

/**
 * CEO view (permission `costs.manage`): last, previous and average cost of
 * every item from its costed purchases, the margin against the public price
 * (per square foot for glass), the minimum margin that raises a warning and
 * the value of the stock in each site.
 */
@Component({
  selector: 'app-item-costs',
  imports: [DatePipe, DecimalPipe, MatIconModule, TranslatePipe, TabBar],
  templateUrl: './item-costs.html',
  styleUrl: './item-costs.css'
})
export class ItemCosts implements OnInit {
  readonly costs = inject(CostAnalysisStore);
  readonly purchases = inject(PurchasesStore);
  readonly inventory = inject(InventoryStore);
  readonly rowsService = inject(InventoryRows);

  readonly filters: readonly CostFilter[] = ['ALL', 'WITH_COST', 'LOW_MARGIN', 'NO_COST'];
  readonly tab = signal<CatalogTab>('GLASS');
  readonly filter = signal<CostFilter>('ALL');
  readonly search = signal('');
  readonly limit = signal(PAGE_SIZE);
  readonly minMarginDraft = signal<string>('');

  readonly ready = computed(() => this.purchases.loaded() && this.rowsService.ready());
  readonly error = computed(() => this.purchases.error() ?? this.inventory.error() ?? this.costs.settingsError());

  /** Each tab shows how many of its items are below the minimum margin. */
  readonly tabs = computed(() => {
    const analysis = this.costs.analysis();
    const rows = this.rowsService.rows();
    return catalogTabs(tab => rows.filter(r => r.category === tab && analysis.get(r.item.id)?.lowMargin).length || null);
  });

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();
    const analysis = this.costs.analysis();
    return this.rowsService.rows()
      .filter(r => r.category === this.tab() && (!term || matchesSearch(r, term)))
      .map(row => ({row, cost: analysis.get(row.item.id)!}))
      .filter(({row, cost}) => {
        if (filter === 'WITH_COST') return cost.summary !== null;
        if (filter === 'LOW_MARGIN') return cost.lowMargin;
        if (filter === 'NO_COST') return cost.summary === null && (row.total ?? 0) > 0;
        return true;
      })
      // Items with a cost first, the lowest margins on top: what needs attention.
      .sort((a, b) => Number(b.cost.summary !== null) - Number(a.cost.summary !== null)
        || (a.cost.margin ?? Infinity) - (b.cost.margin ?? Infinity));
  });
  readonly rows = computed(() => this.filtered().slice(0, this.limit()));

  constructor() {
    effect(() => { this.tab(); this.filter(); this.search(); this.limit.set(PAGE_SIZE); });
    effect(() => {
      const min = this.costs.minMarginPercent();
      this.minMarginDraft.set(min === null ? '' : String(min));
    });
  }

  ngOnInit(): void {
    this.rowsService.ensureLoaded();
    this.purchases.ensureLoaded();
    this.costs.loadSettings();
  }

  siteName(siteId: number): string { return this.inventory.sites().find(s => s.id === siteId)?.name ?? `#${siteId}`; }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }
  onFilter(event: Event): void { this.filter.set((event.target as HTMLSelectElement).value as CostFilter); }
  onMinMargin(event: Event): void { this.minMarginDraft.set((event.target as HTMLInputElement).value); }

  saveMinMargin(): void {
    const text = this.minMarginDraft().trim();
    this.costs.setMinMargin(text === '' ? null : Number(text));
  }

  clearMinMargin(): void {
    this.minMarginDraft.set('');
    this.costs.setMinMargin(null);
  }

  showMore(): void { this.limit.update(n => n + PAGE_SIZE); }

  retry(): void {
    this.purchases.load();
    this.rowsService.ensureLoaded();
    this.costs.loadSettings();
  }
}
