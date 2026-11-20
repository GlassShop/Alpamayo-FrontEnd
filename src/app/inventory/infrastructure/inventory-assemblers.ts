import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Site} from '../domain/model/site.entity';
import {InventoryItem} from '../domain/model/inventory-item.entity';
import {StockLevel} from '../domain/model/stock-level.entity';
import {StockMovement} from '../domain/model/stock-movement.entity';
import {
  InventoryItemResource, InventoryItemsResponse, SiteResource, SitesResponse, StockLevelResource, StockLevelsResponse,
  StockMovementResource
} from './inventory-response';

/** New entities have id 0: leave it out so the server assigns one. */
function withId<T extends {id: number}>(resource: T): T {
  if (resource.id) return resource;
  const {id: _omit, ...rest} = resource;
  return rest as T;
}

const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

export class SiteAssembler implements BaseAssembler<Site, SiteResource, SitesResponse> {
  toEntityFromResource(r: SiteResource): Site {
    return {id: r.id, name: r.name, address: r.address ?? ''};
  }
  toResourceFromEntity(e: Site): SiteResource {
    return withId({id: e.id, name: e.name, address: e.address});
  }
  toEntitiesFromResponse(response: SitesResponse): Site[] {
    return response.sites.map(r => this.toEntityFromResource(r));
  }
}

export class InventoryItemAssembler implements BaseAssembler<InventoryItem, InventoryItemResource, InventoryItemsResponse> {
  toEntityFromResource(r: InventoryItemResource): InventoryItem {
    return {
      id: r.id, glassTypeId: nullableNumber(r.glassTypeId), productId: nullableNumber(r.productId),
      color: r.color ?? '', sku: r.sku ?? '', widthCm: nullableNumber(r.widthCm), heightCm: nullableNumber(r.heightCm),
      packKind: r.packKind ?? null, unitsPerPack: nullableNumber(r.unitsPerPack), minStock: nullableNumber(r.minStock)
    };
  }
  toResourceFromEntity(e: InventoryItem): InventoryItemResource {
    return withId({
      id: e.id, glassTypeId: e.glassTypeId, productId: e.productId, color: e.color, sku: e.sku,
      widthCm: e.widthCm, heightCm: e.heightCm, packKind: e.packKind, unitsPerPack: e.unitsPerPack, minStock: e.minStock
    });
  }
  toEntitiesFromResponse(response: InventoryItemsResponse): InventoryItem[] {
    return response.inventoryItems.map(r => this.toEntityFromResource(r));
  }
}

export class StockLevelAssembler implements BaseAssembler<StockLevel, StockLevelResource, StockLevelsResponse> {
  toEntityFromResource(r: StockLevelResource): StockLevel {
    return {
      id: r.id, itemId: r.itemId, siteId: r.siteId, quantity: nullableNumber(r.quantity),
      inTransit: r.inTransit === true, notes: r.notes ?? ''
    };
  }
  toResourceFromEntity(e: StockLevel): StockLevelResource {
    return withId({id: e.id, itemId: e.itemId, siteId: e.siteId, quantity: e.quantity, inTransit: e.inTransit, notes: e.notes});
  }
  toEntitiesFromResponse(response: StockLevelsResponse): StockLevel[] {
    return response.stockLevels.map(r => this.toEntityFromResource(r));
  }
}

/** Read-only: the server writes stock movements. */
export function toStockMovement(r: StockMovementResource): StockMovement {
  return {
    id: r.id, itemId: r.itemId, siteId: r.siteId, kind: r.kind, delta: Number(r.delta),
    quantityAfter: Number(r.quantityAfter), at: r.at, by: r.by, ...(r.reason ? {reason: r.reason} : {}),
    ...(r.purchaseId ? {purchaseId: r.purchaseId} : {}),
    ...(r.quoteId ? {quoteId: r.quoteId} : {})
  };
}
