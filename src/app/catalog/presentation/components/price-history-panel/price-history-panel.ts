import {Component, computed, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {PriceHistoryStore} from '../../../application/price-history.store';
import {CatalogStore} from '../../../application/catalog.store';
import {changePercent} from '../../../domain/model/price-change.entity';
import {glassTypeLabel} from '../../../domain/model/glass-type.entity';

/** CEO's price history: who changed which price, when, from how much to how much, and why. */
@Component({
  selector: 'app-price-history-panel',
  imports: [DatePipe, DecimalPipe, TranslatePipe, MatIconModule],
  templateUrl: './price-history-panel.html',
  styleUrl: './price-history-panel.css'
})
export class PriceHistoryPanel {
  readonly history = inject(PriceHistoryStore);
  readonly catalog = inject(CatalogStore);
  readonly percent = changePercent;

  private readonly glassNames = computed(() => new Map(this.catalog.glassTypes().map(g => [g.id, glassTypeLabel(g)])));
  private readonly listNames = computed(() => new Map(this.catalog.priceLists().map(l => [l.id, l.name])));

  glassName(id: number): string { return this.glassNames().get(id) ?? `#${id}`; }
  listName(id: number): string { return this.listNames().get(id) ?? `#${id}`; }

  onGlass(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.history.glassTypeId.set(v ? Number(v) : null);
  }

  onList(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.history.priceListId.set(v ? Number(v) : null);
  }
}
