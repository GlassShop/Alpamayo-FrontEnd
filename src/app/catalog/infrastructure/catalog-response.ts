import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface GlassTypeResource extends BaseResource {
  name: string;
  thicknessMm: number;
  color: string;
}
export interface GlassTypesResponse extends BaseResponse { glassTypes: GlassTypeResource[]; }

export interface PriceListResource extends BaseResource {
  name: string;
}
export interface PriceListsResponse extends BaseResponse { priceLists: PriceListResource[]; }

export interface PriceResource extends BaseResource {
  glassTypeId: number;
  priceListId: number;
  pricePerSqFt: number;
}
export interface PricesResponse extends BaseResponse { prices: PriceResource[]; }
