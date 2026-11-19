import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Series} from '../domain/model/series.entity';
import {Product} from '../domain/model/product.entity';
import {ProductPriceChange} from '../domain/model/product-price-change.entity';
import {
  ProductPriceChangeResource, ProductResource, ProductsResponse, SeriesResource, SeriesResponse
} from './products-response';

/** New entities have id 0: leave it out so the server assigns one. */
function withId<T extends {id: number}>(resource: T): T {
  if (resource.id) return resource;
  const {id: _omit, ...rest} = resource;
  return rest as T;
}

const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

export class SeriesAssembler implements BaseAssembler<Series, SeriesResource, SeriesResponse> {
  toEntityFromResource(r: SeriesResource): Series {
    return {id: r.id, name: r.name};
  }
  toResourceFromEntity(e: Series): SeriesResource {
    return withId({id: e.id, name: e.name});
  }
  toEntitiesFromResponse(response: SeriesResponse): Series[] {
    return response.series.map(r => this.toEntityFromResource(r));
  }
}

export class ProductAssembler implements BaseAssembler<Product, ProductResource, ProductsResponse> {
  toEntityFromResource(r: ProductResource): Product {
    return {
      id: r.id, category: r.category, code: r.code ?? '', name: r.name, seriesId: nullableNumber(r.seriesId),
      brand: r.brand ?? '', weightClass: r.weightClass ?? null, publicPrice: nullableNumber(r.publicPrice)
    };
  }
  toResourceFromEntity(e: Product): ProductResource {
    return withId({
      id: e.id, category: e.category, code: e.code, name: e.name, seriesId: e.seriesId,
      brand: e.brand, weightClass: e.weightClass, publicPrice: e.publicPrice
    });
  }
  toEntitiesFromResponse(response: ProductsResponse): Product[] {
    return response.products.map(r => this.toEntityFromResource(r));
  }
}

/** Read-only: the server writes the price history. */
export function toProductPriceChange(r: ProductPriceChangeResource): ProductPriceChange {
  return {
    id: r.id, productId: r.productId, label: r.label, previousPrice: nullableNumber(r.previousPrice),
    newPrice: Number(r.newPrice), changedAt: r.changedAt, changedBy: r.changedBy,
    ...(r.reason ? {reason: r.reason} : {})
  };
}
