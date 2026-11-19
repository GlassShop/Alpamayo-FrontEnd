import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {Purchase, PurchaseCosts} from '../domain/model/purchase.entity';
import {StockLevel} from '../../inventory/domain/model/stock-level.entity';
import {StockLevelAssembler} from '../../inventory/infrastructure/inventory-assemblers';
import {CostSettingsResource, PurchaseResource, RegisteredArrivalResource} from './purchases-response';

const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

/** Server resource → entity. Amounts are missing for roles other than the CEO. */
export function toPurchase(r: PurchaseResource): Purchase {
  return {
    id: r.id, date: r.date, supplier: r.supplier, siteId: r.siteId, status: r.status, notes: r.notes ?? '',
    lines: r.lines.map(l => ({
      itemId: l.itemId, quantity: Number(l.quantity), packs: nullableNumber(l.packs),
      unitPriceUsd: nullableNumber(l.unitPriceUsd), unitCost: nullableNumber(l.unitCost)
    })),
    costs: r.costs ? {
      exchangeRate: Number(r.costs.exchangeRate),
      freight: {amount: Number(r.costs.freight.amount), currency: r.costs.freight.currency},
      transport: {amount: Number(r.costs.transport.amount), currency: r.costs.transport.currency}
    } : null,
    createdBy: r.createdBy, createdAt: r.createdAt, costedBy: r.costedBy ?? null, costedAt: r.costedAt ?? null
  };
}

/** What arrived: lines in units, with the packs typed for reference. */
export interface ArrivalCommand {
  date: string;
  supplier: string;
  siteId: number;
  notes: string;
  lines: {itemId: number; quantity: number; packs: number | null}[];
}

/** Costs typed by the CEO: one dollar price per line, in the order of the lines. */
export interface CostsCommand extends PurchaseCosts {
  unitPricesUsd: number[];
}

/**
 * Purchases (arrivals of goods) and the cost settings. Every role registers
 * arrivals and reads them without amounts; only the CEO costs them and reads
 * or changes the minimum margin.
 */
@Injectable({providedIn: 'root'})
export class PurchasesApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly purchasesUrl = `${environment.apiBaseUrl}${environment.purchasesEndpointPath}`;
  private readonly settingsUrl = `${environment.apiBaseUrl}${environment.costSettingsEndpointPath}`;
  private readonly levelAssembler = new StockLevelAssembler();

  getPurchases(): Observable<Purchase[]> {
    return this.http.get<PurchaseResource[]>(this.purchasesUrl).pipe(map(list => list.map(toPurchase)));
  }

  /** Registers what arrived; the server adds it to the stock and answers with the levels it changed. */
  registerArrival(command: ArrivalCommand): Observable<{purchase: Purchase; levels: StockLevel[]}> {
    const body = {...command, supplier: command.supplier.trim(), notes: command.notes.trim()};
    return this.http.post<RegisteredArrivalResource>(this.purchasesUrl, body).pipe(map(r => ({
      purchase: toPurchase(r.purchase), levels: r.levels.map(l => this.levelAssembler.toEntityFromResource(l))
    })));
  }

  /** Costs a purchase (CEO); the server works out and stores the landed cost of each line. */
  setCosts(purchaseId: number, command: CostsCommand): Observable<Purchase> {
    return this.http.put<PurchaseResource>(`${this.purchasesUrl}/${purchaseId}/costs`, command).pipe(map(toPurchase));
  }

  getSettings(): Observable<{minMarginPercent: number | null}> {
    return this.http.get<CostSettingsResource>(this.settingsUrl)
      .pipe(map(r => ({minMarginPercent: nullableNumber(r?.minMarginPercent)})));
  }

  setMinMargin(minMarginPercent: number | null): Observable<{minMarginPercent: number | null}> {
    return this.http.put<CostSettingsResource>(this.settingsUrl, {minMarginPercent})
      .pipe(map(r => ({minMarginPercent: nullableNumber(r?.minMarginPercent)})));
  }
}
