import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Site} from '../domain/model/site.entity';
import {InventoryItem} from '../domain/model/inventory-item.entity';
import {StockLevel} from '../domain/model/stock-level.entity';
import {MovementKind, StockMovement} from '../domain/model/stock-movement.entity';
import {InventoryItemAssembler, SiteAssembler, StockLevelAssembler, toStockMovement} from './inventory-assemblers';
import {
  InventoryItemResource, InventoryItemsResponse, RecordedMovementResource, SiteResource, SitesResponse,
  StockLevelResource, StockLevelsResponse, StockMovementResource
} from './inventory-response';

/** Longest reason kept for a stock movement. */
export const MAX_MOVEMENT_REASON = 140;

const url = (path: string) => `${environment.apiBaseUrl}${path}`;

class SitesApiEndpoint extends BaseApiEndpoint<Site, SiteResource, SitesResponse, SiteAssembler> {
  constructor(http: HttpClient) { super(http, url(environment.sitesEndpointPath), new SiteAssembler()); }
}

class InventoryItemsApiEndpoint
  extends BaseApiEndpoint<InventoryItem, InventoryItemResource, InventoryItemsResponse, InventoryItemAssembler> {
  constructor(http: HttpClient) { super(http, url(environment.inventoryItemsEndpointPath), new InventoryItemAssembler()); }
}

class StockLevelsApiEndpoint extends BaseApiEndpoint<StockLevel, StockLevelResource, StockLevelsResponse, StockLevelAssembler> {
  constructor(http: HttpClient) { super(http, url(environment.stockLevelsEndpointPath), new StockLevelAssembler()); }
}

/** A movement to record: a count sets the quantity, an adjustment adds or removes units. */
export interface MovementCommand {
  itemId: number;
  siteId: number;
  kind: MovementKind;
  /** COUNT: the quantity counted. ADJUSTMENT: units added (+) or removed (−). */
  quantity: number;
  reason?: string;
}

/** Infrastructure facade for the inventory bounded context. Every role may use it. */
@Injectable({providedIn: 'root'})
export class InventoryApi extends BaseApi {
  private readonly sites: SitesApiEndpoint;
  private readonly items: InventoryItemsApiEndpoint;
  private readonly levels: StockLevelsApiEndpoint;
  private readonly itemAssembler = new InventoryItemAssembler();
  private readonly levelAssembler = new StockLevelAssembler();
  private readonly itemsUrl = url(environment.inventoryItemsEndpointPath);
  private readonly levelsUrl = url(environment.stockLevelsEndpointPath);
  private readonly movementsUrl = url(environment.stockMovementsEndpointPath);

  constructor(private readonly http: HttpClient) {
    super();
    this.sites = new SitesApiEndpoint(http);
    this.items = new InventoryItemsApiEndpoint(http);
    this.levels = new StockLevelsApiEndpoint(http);
  }

  getSites(): Observable<Site[]> { return this.sites.getAll(); }
  getItems(): Observable<InventoryItem[]> { return this.items.getAll(); }
  getLevels(): Observable<StockLevel[]> { return this.levels.getAll(); }

  createItem(item: InventoryItem): Observable<InventoryItem> { return this.items.create(item); }

  /** Changes colour, code, size, pack or minimum; never the product it belongs to. */
  updateItem(item: InventoryItem): Observable<InventoryItem> {
    const {glassTypeId: _g, productId: _p, id: _id, ...fields} = this.itemAssembler.toResourceFromEntity(item);
    return this.http.patch<InventoryItemResource>(`${this.itemsUrl}/${item.id}`, fields)
      .pipe(map(r => this.itemAssembler.toEntityFromResource(r)));
  }

  /** Records a count or an adjustment; the server updates the stock level and keeps the movement. */
  recordMovement(command: MovementCommand): Observable<{movement: StockMovement; level: StockLevel}> {
    const reason = command.reason?.trim().slice(0, MAX_MOVEMENT_REASON);
    const body = {itemId: command.itemId, siteId: command.siteId, kind: command.kind, quantity: command.quantity, ...(reason ? {reason} : {})};
    return this.http.post<RecordedMovementResource>(this.movementsUrl, body).pipe(map(r => ({
      movement: toStockMovement(r.movement), level: this.levelAssembler.toEntityFromResource(r.level)
    })));
  }

  /** Creates the level of an item in a site that was never counted, to mark it "en camino" or add notes. */
  createLevel(itemId: number, siteId: number, changes: {inTransit?: boolean; notes?: string}): Observable<StockLevel> {
    return this.http.post<StockLevelResource>(this.levelsUrl, {itemId, siteId, ...changes})
      .pipe(map(r => this.levelAssembler.toEntityFromResource(r)));
  }

  updateLevel(levelId: number, changes: {inTransit?: boolean; notes?: string}): Observable<StockLevel> {
    return this.http.patch<StockLevelResource>(`${this.levelsUrl}/${levelId}`, changes)
      .pipe(map(r => this.levelAssembler.toEntityFromResource(r)));
  }

  /** Movements newest first, optionally of one item. */
  getMovements(itemId?: number): Observable<StockMovement[]> {
    const params = itemId === undefined ? new HttpParams() : new HttpParams().set('itemId', itemId);
    return this.http.get<StockMovementResource[]>(this.movementsUrl, {params}).pipe(map(list => list.map(toStockMovement)));
  }
}
