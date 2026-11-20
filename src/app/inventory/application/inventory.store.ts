import {computed, inject, Injectable, signal} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap, tap} from 'rxjs';
import {InventoryApi, MovementCommand} from '../infrastructure/inventory-api';
import {Site} from '../domain/model/site.entity';
import {InventoryItem, PackKind} from '../domain/model/inventory-item.entity';
import {StockLevel} from '../domain/model/stock-level.entity';
import {MovementKind} from '../domain/model/stock-movement.entity';
import {isValidAdjustment, isValidQuantity, stockStatus, StockStatus} from '../domain/services/stock-rules';

/** Fields of an item that can change after it is created. */
export interface ItemDetails {
  color: string;
  sku: string;
  widthCm: number | null;
  heightCm: number | null;
  packKind: PackKind | null;
  unitsPerPack: number | null;
  minStock: number | null;
}

/** What the stock dialog saves for one item in one site. */
export interface StockChange {
  /** COUNT: the quantity counted. ADJUSTMENT: units added (+) or removed (−). */
  movement?: {kind: MovementKind; quantity: number};
  reason?: string;
  inTransit?: boolean;
  notes?: string;
}

/** A new item: the product or glass type it belongs to, its details and the units counted per site. */
export interface NewItem extends ItemDetails {
  glassTypeId: number | null;
  productId: number | null;
  initialCounts: {siteId: number; quantity: number}[];
}

/**
 * Stock per site: items, their quantity in each site and the flags typed by
 * hand ("en camino", notes). Every role uses it; quantities only change by
 * recording a count or an adjustment, which the server keeps as a movement.
 * Error values are translation keys.
 */
@Injectable({providedIn: 'root'})
export class InventoryStore {
  private readonly api = inject(InventoryApi);

  private readonly sitesSignal = signal<Site[]>([]);
  private readonly itemsSignal = signal<InventoryItem[]>([]);
  private readonly levelsSignal = signal<StockLevel[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadedSignal = signal(false);
  private readonly movementsSignal = signal(0);

  readonly sites = this.sitesSignal.asReadonly();
  readonly items = this.itemsSignal.asReadonly();
  readonly levels = this.levelsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  /** Increases every time a movement is recorded, so the movement history can refresh. */
  readonly movementsRecorded = this.movementsSignal.asReadonly();

  private readonly itemIndex = computed(() => new Map(this.itemsSignal().map(i => [i.id, i])));
  /** Level lookup indexed by "itemId:siteId". */
  private readonly levelIndex = computed(() => new Map(this.levelsSignal().map(l => [this.key(l.itemId, l.siteId), l])));

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({sites: this.api.getSites(), items: this.api.getItems(), levels: this.api.getLevels()}).subscribe({
      next: ({sites, items, levels}) => {
        this.sitesSignal.set(sites);
        this.itemsSignal.set(items);
        this.levelsSignal.set(levels);
        this.loadingSignal.set(false);
        this.loadedSignal.set(true);
      },
      error: () => {
        this.errorSignal.set('inventory.error.load');
        this.loadingSignal.set(false);
      }
    });
  }

  ensureLoaded(): void {
    if (!this.loadedSignal() && !this.loadingSignal()) this.load();
  }

  item(id: number): InventoryItem | undefined { return this.itemIndex().get(id); }

  levelFor(itemId: number, siteId: number): StockLevel | undefined {
    return this.levelIndex().get(this.key(itemId, siteId));
  }

  /** Units in a site, or null when the item was never counted there. */
  quantityAt(itemId: number, siteId: number): number | null {
    return this.levelFor(itemId, siteId)?.quantity ?? null;
  }

  /** Units in every site; null when no site has counted the item. */
  totalQuantity(itemId: number): number | null {
    const counted = this.sitesSignal().map(s => this.quantityAt(itemId, s.id)).filter((q): q is number => q !== null);
    return counted.length ? counted.reduce((sum, q) => sum + q, 0) : null;
  }

  statusAt(itemId: number, siteId: number): StockStatus {
    return stockStatus(this.quantityAt(itemId, siteId), this.item(itemId)?.minStock ?? null);
  }

  /** Records the quantity someone counted. */
  count(itemId: number, siteId: number, quantity: number, reason?: string): void {
    if (!isValidQuantity(quantity)) {
      this.errorSignal.set('inventory.error.invalid-quantity');
      return;
    }
    this.record({itemId, siteId, kind: 'COUNT', quantity, reason});
  }

  /** Adds (positive) or removes (negative) units. */
  adjust(itemId: number, siteId: number, delta: number, reason?: string): void {
    if (!isValidAdjustment(this.quantityAt(itemId, siteId), delta)) {
      this.errorSignal.set('inventory.error.invalid-adjustment');
      return;
    }
    this.record({itemId, siteId, kind: 'ADJUSTMENT', quantity: delta, reason});
  }

  /**
   * Saves what was typed in the stock dialog in order: first the movement
   * (if any), then the "en camino" flag and notes on the level it left, so
   * both never race to create the same level.
   */
  recordStock(itemId: number, siteId: number, change: StockChange): void {
    const {movement, reason} = change;
    if (movement) {
      const valid = movement.kind === 'COUNT'
        ? isValidQuantity(movement.quantity)
        : isValidAdjustment(this.quantityAt(itemId, siteId), movement.quantity);
      if (!valid) {
        this.errorSignal.set(movement.kind === 'COUNT' ? 'inventory.error.invalid-quantity' : 'inventory.error.invalid-adjustment');
        return;
      }
    }
    const flags = this.flagChanges(this.levelFor(itemId, siteId), change);
    if (!movement && !flags) return;

    const movement$: Observable<StockLevel | undefined> = movement
      ? this.api.recordMovement({itemId, siteId, kind: movement.kind, quantity: movement.quantity, reason}).pipe(map(r => r.level))
      : of(this.levelFor(itemId, siteId));
    const request$ = movement$.pipe(switchMap(level => {
      const pending = this.flagChanges(level, change);
      const flags$: Observable<StockLevel | undefined> = !pending ? of(level)
        : level ? this.api.updateLevel(level.id, pending) : this.api.createLevel(itemId, siteId, pending);
      return flags$.pipe(map(final => ({final, moved: !!movement})));
    }));
    this.save(request$, ({final, moved}) => {
      if (final) this.putLevel(final);
      if (moved) this.movementsSignal.update(n => n + 1);
    });
  }

  setInTransit(itemId: number, siteId: number, inTransit: boolean): void {
    this.changeLevel(itemId, siteId, {inTransit});
  }

  setNotes(itemId: number, siteId: number, notes: string): void {
    const clean = notes.trim();
    if ((this.levelFor(itemId, siteId)?.notes ?? '') === clean) return;
    this.changeLevel(itemId, siteId, {notes: clean});
  }

  /** Adds an item and records the units counted in each site in the same step. */
  createItem(input: NewItem): void {
    const problem = this.itemProblem(input) ?? (
      (input.glassTypeId === null) === (input.productId === null) ? 'inventory.error.invalid-item' : null);
    if (problem) { this.errorSignal.set(problem); return; }
    if (input.initialCounts.some(c => !isValidQuantity(c.quantity))) {
      this.errorSignal.set('inventory.error.invalid-quantity');
      return;
    }
    const duplicate = this.itemsSignal().some(i => i.glassTypeId === input.glassTypeId && i.productId === input.productId
      && i.color.trim().toLowerCase() === input.color.trim().toLowerCase()
      && i.widthCm === input.widthCm && i.heightCm === input.heightCm);
    if (duplicate) { this.errorSignal.set('inventory.error.duplicate-item'); return; }

    const {initialCounts, ...fields} = input;
    const request$ = this.api.createItem({id: 0, ...fields, ...this.cleanDetails(fields)}).pipe(
      switchMap(item => (initialCounts.length
        ? forkJoin(initialCounts.map(c => this.api.recordMovement({itemId: item.id, siteId: c.siteId, kind: 'COUNT', quantity: c.quantity, reason: 'Stock inicial'})))
        : of([])).pipe(map(recorded => ({item, levels: recorded.map(r => r.level)}))))
    );
    this.save(request$, ({item, levels}) => {
      this.itemsSignal.update(list => [...list, item]);
      levels.forEach(level => this.putLevel(level));
      if (levels.length) this.movementsSignal.update(n => n + 1);
    });
  }

  updateItem(itemId: number, details: ItemDetails): void {
    const existing = this.item(itemId);
    if (!existing) return;
    const problem = this.itemProblem(details);
    if (problem) { this.errorSignal.set(problem); return; }
    this.save(this.api.updateItem({...existing, ...this.cleanDetails(details)}), saved =>
      this.itemsSignal.update(list => list.map(i => i.id === saved.id ? saved : i)));
  }

  clearError(): void { this.errorSignal.set(null); }

  /**
   * Takes the stock levels the server changed elsewhere — a registered
   * purchase, a quote sold or a sale annulled — so the inventory shows the
   * new quantities at once and the movement history refreshes.
   */
  applyRecordedLevels(levels: readonly StockLevel[]): void {
    if (!levels.length) return;
    levels.forEach(level => this.putLevel(level));
    this.movementsSignal.update(n => n + 1);
  }

  private record(command: MovementCommand): void {
    this.save(this.api.recordMovement(command), ({level}) => {
      this.putLevel(level);
      this.movementsSignal.update(n => n + 1);
    });
  }

  private changeLevel(itemId: number, siteId: number, changes: {inTransit?: boolean; notes?: string}): void {
    const existing = this.levelFor(itemId, siteId);
    const request$ = existing ? this.api.updateLevel(existing.id, changes) : this.api.createLevel(itemId, siteId, changes);
    this.save(request$, level => this.putLevel(level));
  }

  /** The flag and notes changes still to send for a level, or null when nothing changed. */
  private flagChanges(level: StockLevel | undefined, change: StockChange): {inTransit?: boolean; notes?: string} | null {
    const out: {inTransit?: boolean; notes?: string} = {};
    if (change.inTransit !== undefined && change.inTransit !== (level?.inTransit ?? false)) out.inTransit = change.inTransit;
    if (change.notes !== undefined && change.notes.trim() !== (level?.notes ?? '')) out.notes = change.notes.trim();
    return Object.keys(out).length ? out : null;
  }

  private itemProblem(details: ItemDetails): string | null {
    const positiveOrNull = (v: number | null) => v === null || (Number.isFinite(v) && v > 0);
    if (!positiveOrNull(details.widthCm) || !positiveOrNull(details.heightCm)
      || (details.widthCm === null) !== (details.heightCm === null)) return 'inventory.error.invalid-size';
    if ((details.packKind === null) !== (details.unitsPerPack === null)
      || (details.unitsPerPack !== null && !(Number.isInteger(details.unitsPerPack) && details.unitsPerPack >= 1))) {
      return 'inventory.error.invalid-pack';
    }
    if (details.minStock !== null && !isValidQuantity(details.minStock)) return 'inventory.error.invalid-quantity';
    return null;
  }

  private cleanDetails(details: ItemDetails): ItemDetails {
    return {...details, color: details.color.trim(), sku: details.sku.trim()};
  }

  private putLevel(level: StockLevel): void {
    this.levelsSignal.update(list => list.some(l => l.id === level.id) ? list.map(l => l.id === level.id ? level : l) : [...list, level]);
  }

  private save<T>(request$: Observable<T>, onSaved: (saved: T) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.pipe(tap(onSaved)).subscribe({
      next: () => this.savingSignal.set(false),
      error: () => {
        this.errorSignal.set('inventory.error.save');
        this.savingSignal.set(false);
      }
    });
  }

  private key(itemId: number, siteId: number): string { return `${itemId}:${siteId}`; }
}
