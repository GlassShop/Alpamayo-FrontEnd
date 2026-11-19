import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {Money} from '../domain/services/landed-cost';
import {PurchaseStatus} from '../domain/model/purchase.entity';
import {StockLevelResource} from '../../inventory/infrastructure/inventory-response';

export interface PurchaseLineResource {
  itemId: number;
  quantity: number;
  packs?: number | null;
  unitPriceUsd?: number | null;
  unitCost?: number | null;
}

export interface PurchaseResource extends BaseResource {
  date: string;
  supplier: string;
  siteId: number;
  lines: PurchaseLineResource[];
  status: PurchaseStatus;
  costs?: {exchangeRate: number; freight: Money; transport: Money} | null;
  notes?: string | null;
  createdBy: {id: number; fullName: string};
  createdAt: string;
  costedBy?: {id: number; fullName: string} | null;
  costedAt?: string | null;
}
export interface PurchasesResponse extends BaseResponse { purchases: PurchaseResource[]; }

/** The server answers a registered arrival with the purchase and the stock levels it changed. */
export interface RegisteredArrivalResource {
  purchase: PurchaseResource;
  levels: StockLevelResource[];
}

export interface CostSettingsResource {
  minMarginPercent: number | null;
}
