import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';
import {ProductCategory, WeightClass} from '../domain/model/product.entity';

export interface SeriesResource extends BaseResource {
  name: string;
}
export interface SeriesResponse extends BaseResponse { series: SeriesResource[]; }

export interface ProductResource extends BaseResource {
  category: ProductCategory;
  code?: string | null;
  name: string;
  seriesId?: number | null;
  brand?: string | null;
  weightClass?: WeightClass | null;
  publicPrice?: number | null;
}
export interface ProductsResponse extends BaseResponse { products: ProductResource[]; }

export interface ProductPriceChangeResource extends BaseResource {
  productId: number;
  label: string;
  previousPrice: number | null;
  newPrice: number;
  reason?: string | null;
  changedAt: string;
  changedBy: {id: number; fullName: string};
}
