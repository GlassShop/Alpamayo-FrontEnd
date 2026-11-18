import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {GlassType} from '../domain/model/glass-type.entity';
import {PriceList} from '../domain/model/price-list.entity';
import {Price} from '../domain/model/price.entity';
import {GlassTypeAssembler, PriceAssembler, PriceListAssembler} from './catalog-assemblers';
import {
  GlassTypeResource, GlassTypesResponse, PriceListResource, PriceListsResponse, PriceResource, PricesResponse
} from './catalog-response';

export class GlassTypesApiEndpoint
  extends BaseApiEndpoint<GlassType, GlassTypeResource, GlassTypesResponse, GlassTypeAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.glassTypesEndpointPath}`, new GlassTypeAssembler());
  }
}

export class PriceListsApiEndpoint
  extends BaseApiEndpoint<PriceList, PriceListResource, PriceListsResponse, PriceListAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.priceListsEndpointPath}`, new PriceListAssembler());
  }
}

export class PricesApiEndpoint
  extends BaseApiEndpoint<Price, PriceResource, PricesResponse, PriceAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.pricesEndpointPath}`, new PriceAssembler());
  }
}
