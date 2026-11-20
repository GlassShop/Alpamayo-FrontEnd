import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {PackKind} from '../domain/model/inventory-item.entity';
import {MovementKind} from '../domain/model/stock-movement.entity';

export interface SiteResource extends BaseResource {
  name: string;
  address?: string | null;
}
export interface SitesResponse extends BaseResponse { sites: SiteResource[]; }

export interface InventoryItemResource extends BaseResource {
  glassTypeId?: number | null;
  productId?: number | null;
  color?: string | null;
  sku?: string | null;
  widthCm?: number | null;
  heightCm?: number | null;
  packKind?: PackKind | null;
  unitsPerPack?: number | null;
  minStock?: number | null;
}
export interface InventoryItemsResponse extends BaseResponse { inventoryItems: InventoryItemResource[]; }

export interface StockLevelResource extends BaseResource {
  itemId: number;
  siteId: number;
  quantity?: number | null;
  inTransit?: boolean | null;
  notes?: string | null;
}
export interface StockLevelsResponse extends BaseResponse { stockLevels: StockLevelResource[]; }

export interface StockMovementResource extends BaseResource {
  itemId: number;
  siteId: number;
  kind: MovementKind;
  delta: number;
  quantityAfter: number;
  reason?: string | null;
  purchaseId?: number | null;
  quoteId?: number | null;
  at: string;
  by: {id: number; fullName: string};
}

/** What the server answers when a movement is recorded: the movement and the stock level it left. */
export interface RecordedMovementResource {
  movement: StockMovementResource;
  level: StockLevelResource;
}
