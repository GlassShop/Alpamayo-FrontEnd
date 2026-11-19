import {Component, computed, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {StockMovementsStore} from '../../../application/stock-movements.store';
import {InventoryStore} from '../../../application/inventory.store';
import {InventoryRows} from '../../inventory-rows';

/** Who counted or moved which stock, where, when, by how much and why. */
@Component({
  selector: 'app-movements-panel',
  imports: [DatePipe, MatIconModule, TranslatePipe],
  templateUrl: './movements-panel.html',
  styleUrl: './movements-panel.css'
})
export class MovementsPanel {
  readonly movements = inject(StockMovementsStore);
  private readonly inventory = inject(InventoryStore);
  private readonly rows = inject(InventoryRows);

  private readonly siteNames = computed(() => new Map(this.inventory.sites().map(s => [s.id, s.name])));
  readonly filteredItem = computed(() => {
    const id = this.movements.itemId();
    return id === null ? null : this.rows.row(id) ?? null;
  });

  itemName(itemId: number): string {
    const row = this.rows.row(itemId);
    return row ? [row.name, row.variant].filter(Boolean).join(' · ') : `#${itemId}`;
  }

  siteName(siteId: number): string { return this.siteNames().get(siteId) ?? `#${siteId}`; }
}
