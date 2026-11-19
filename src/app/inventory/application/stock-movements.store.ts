import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {InventoryApi} from '../infrastructure/inventory-api';
import {StockMovement} from '../domain/model/stock-movement.entity';
import {InventoryStore} from './inventory.store';

/** How many of the latest movements are listed when no item is chosen. */
export const RECENT_MOVEMENTS = 50;

/**
 * Who changed which stock, when, by how much and why. Read-only: the server
 * writes a movement for every count or adjustment.
 */
@Injectable({providedIn: 'root'})
export class StockMovementsStore {
  private readonly api = inject(InventoryApi);
  private readonly inventory = inject(InventoryStore);

  private readonly movementsSignal = signal<StockMovement[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<'load' | null>(null);
  private readonly loadedSignal = signal(false);

  /** Item whose movements are shown, or null for the latest of every item. */
  readonly itemId = signal<number | null>(null);
  /** Site to show, or null for every site. */
  readonly siteId = signal<number | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly movements = computed(() => {
    const item = this.itemId();
    const site = this.siteId();
    const filtered = [...this.movementsSignal()]
      .sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id)
      .filter(m => (item === null || m.itemId === item) && (site === null || m.siteId === site));
    return item === null ? filtered.slice(0, RECENT_MOVEMENTS) : filtered;
  });

  constructor() {
    // A recorded count or adjustment adds a movement on the server: refresh if the history is in use.
    effect(() => {
      this.inventory.movementsRecorded();
      if (untracked(() => this.loadedSignal())) untracked(() => this.load());
    });
  }

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getMovements().subscribe({
      next: movements => { this.movementsSignal.set(movements); this.loadingSignal.set(false); this.loadedSignal.set(true); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  showFor(itemId: number | null): void { this.itemId.set(itemId); }
}
