import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {GlassType} from '../domain/model/glass-type.entity';
import {PriceList} from '../domain/model/price-list.entity';
import {Price} from '../domain/model/price.entity';
import {
  GlassTypeResource, GlassTypesResponse, PriceListResource, PriceListsResponse, PriceResource, PricesResponse
} from './catalog-response';

/** New entities have id 0: leave it out so the server assigns one. */
function withId<T extends { id: number }>(resource: T): T {
  if (resource.id) return resource;
  const { id: _omit, ...rest } = resource;
  return rest as T;
}

export class GlassTypeAssembler implements BaseAssembler<GlassType, GlassTypeResource, GlassTypesResponse> {
  toEntityFromResource(r: GlassTypeResource): GlassType {
    return { id: r.id, name: r.name, thicknessMm: Number(r.thicknessMm), color: r.color ?? '' };
  }
  toResourceFromEntity(e: GlassType): GlassTypeResource {
    return withId({ id: e.id, name: e.name, thicknessMm: e.thicknessMm, color: e.color });
  }
  toEntitiesFromResponse(response: GlassTypesResponse): GlassType[] {
    return response.glassTypes.map(r => this.toEntityFromResource(r));
  }
}

export class PriceListAssembler implements BaseAssembler<PriceList, PriceListResource, PriceListsResponse> {
  toEntityFromResource(r: PriceListResource): PriceList {
    return { id: r.id, name: r.name };
  }
  toResourceFromEntity(e: PriceList): PriceListResource {
    return withId({ id: e.id, name: e.name });
  }
  toEntitiesFromResponse(response: PriceListsResponse): PriceList[] {
    return response.priceLists.map(r => this.toEntityFromResource(r));
  }
}

export class PriceAssembler implements BaseAssembler<Price, PriceResource, PricesResponse> {
  toEntityFromResource(r: PriceResource): Price {
    return { id: r.id, glassTypeId: r.glassTypeId, priceListId: r.priceListId, pricePerSqFt: Number(r.pricePerSqFt) };
  }
  toResourceFromEntity(e: Price): PriceResource {
    return withId({ id: e.id, glassTypeId: e.glassTypeId, priceListId: e.priceListId, pricePerSqFt: e.pricePerSqFt });
  }
  toEntitiesFromResponse(response: PricesResponse): Price[] {
    return response.prices.map(r => this.toEntityFromResource(r));
  }
}
