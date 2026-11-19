import {Component, effect, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CostAnalysisStore} from '../../../application/cost-analysis.store';
import {InventoryStore} from '../../../../inventory/application/inventory.store';

/**
 * CEO strip above the stock table: the value of the stock in each site at
 * average cost and the minimum margin that marks items selling almost at cost.
 */
@Component({
  selector: 'app-cost-summary',
  imports: [DecimalPipe, MatIconModule, TranslatePipe],
  templateUrl: './cost-summary.html',
  styleUrl: './cost-summary.css'
})
export class CostSummary {
  readonly costs = inject(CostAnalysisStore);
  private readonly inventory = inject(InventoryStore);

  readonly minMarginDraft = signal('');

  constructor() {
    effect(() => {
      const min = this.costs.minMarginPercent();
      this.minMarginDraft.set(min === null ? '' : String(min));
    });
  }

  siteName(siteId: number): string { return this.inventory.sites().find(s => s.id === siteId)?.name ?? `#${siteId}`; }

  onMinMargin(event: Event): void { this.minMarginDraft.set((event.target as HTMLInputElement).value); }

  saveMinMargin(): void {
    const text = this.minMarginDraft().trim();
    this.costs.setMinMargin(text === '' ? null : Number(text));
  }

  clearMinMargin(): void {
    this.minMarginDraft.set('');
    this.costs.setMinMargin(null);
  }
}
