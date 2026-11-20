import {computed, inject, Injectable, signal} from '@angular/core';
import {Observable, tap} from 'rxjs';
import {ArrivalCommand, CostsCommand, PurchasesApi} from '../infrastructure/purchases-api';
import {Purchase} from '../domain/model/purchase.entity';
import {InventoryStore} from '../../inventory/application/inventory.store';

/**
 * Purchases: arrivals registered by any role (the stock goes up at once) and
 * the costs the CEO types afterwards. Other roles receive purchases without
 * amounts. Error values are translation keys.
 */
@Injectable({providedIn: 'root'})
export class PurchasesStore {
  private readonly api = inject(PurchasesApi);
  private readonly inventory = inject(InventoryStore);

  private readonly purchasesSignal = signal<Purchase[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadedSignal = signal(false);

  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();

  /** Newest first. */
  readonly purchases = computed(() =>
    [...this.purchasesSignal()].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));

  readonly pendingCount = computed(() => this.purchasesSignal().filter(p => p.status === 'PENDING_COST').length);

  /** Suppliers already used, offered while typing a new arrival. */
  readonly suppliers = computed(() =>
    [...new Set(this.purchasesSignal().map(p => p.supplier).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')));

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPurchases().subscribe({
      next: purchases => { this.purchasesSignal.set(purchases); this.loadingSignal.set(false); this.loadedSignal.set(true); },
      error: () => { this.errorSignal.set('purchases.error.load'); this.loadingSignal.set(false); }
    });
  }

  ensureLoaded(): void {
    if (!this.loadedSignal() && !this.loadingSignal()) this.load();
  }

  purchase(id: number): Purchase | undefined {
    return this.purchasesSignal().find(p => p.id === id);
  }

  /** Registers goods that arrived at one site; the stock goes up when the server confirms. */
  registerArrival(command: ArrivalCommand): void {
    const problem = this.arrivalProblem(command);
    if (problem) { this.errorSignal.set(problem); return; }
    this.save(this.api.registerArrival(command), ({purchase, levels}) => {
      this.purchasesSignal.update(list => [...list, purchase]);
      this.inventory.applyRecordedLevels(levels);
    });
  }

  /** Types or corrects the costs of a purchase (CEO only). */
  setCosts(purchaseId: number, command: CostsCommand): void {
    const purchase = this.purchase(purchaseId);
    if (!purchase) return;
    const amountOk = (amount: number) => Number.isFinite(amount) && amount >= 0;
    const valid = Number.isFinite(command.exchangeRate) && command.exchangeRate > 0
      && amountOk(command.freight.amount) && amountOk(command.transport.amount)
      && command.unitPricesUsd.length === purchase.lines.length
      && command.unitPricesUsd.every(p => Number.isFinite(p) && p > 0);
    if (!valid) { this.errorSignal.set('purchases.error.invalid-costs'); return; }
    this.save(this.api.setCosts(purchaseId, command), saved =>
      this.purchasesSignal.update(list => list.map(p => p.id === saved.id ? saved : p)));
  }

  clearError(): void { this.errorSignal.set(null); }

  private arrivalProblem(command: ArrivalCommand): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.date)) return 'purchases.error.invalid-date';
    if (!command.supplier.trim()) return 'purchases.error.missing-supplier';
    if (command.lines.length === 0) return 'purchases.error.no-lines';
    if (command.lines.some(l => !Number.isInteger(l.quantity) || l.quantity < 1)) return 'purchases.error.invalid-quantity';
    if (new Set(command.lines.map(l => l.itemId)).size !== command.lines.length) return 'purchases.error.repeated-item';
    return null;
  }

  private save<T>(request$: Observable<T>, onSaved: (saved: T) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.pipe(tap(onSaved)).subscribe({
      next: () => this.savingSignal.set(false),
      error: () => {
        this.errorSignal.set('purchases.error.save');
        this.savingSignal.set(false);
      }
    });
  }
}
