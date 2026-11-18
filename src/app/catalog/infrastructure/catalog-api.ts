import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {GlassType} from '../domain/model/glass-type.entity';
import {PriceList} from '../domain/model/price-list.entity';
import {Price} from '../domain/model/price.entity';
import {GlassTypesApiEndpoint, PriceListsApiEndpoint, PricesApiEndpoint} from './catalog-api-endpoints';

/** Infrastructure facade for the catalog bounded context. */
@Injectable({providedIn: 'root'})
export class CatalogApi extends BaseApi {
  private readonly glassTypes: GlassTypesApiEndpoint;
  private readonly priceLists: PriceListsApiEndpoint;
  private readonly prices: PricesApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.glassTypes = new GlassTypesApiEndpoint(http);
    this.priceLists = new PriceListsApiEndpoint(http);
    this.prices = new PricesApiEndpoint(http);
  }

  getGlassTypes(): Observable<GlassType[]> { return this.glassTypes.getAll(); }
  createGlassType(glass: GlassType): Observable<GlassType> { return this.glassTypes.create(glass); }

  getPriceLists(): Observable<PriceList[]> { return this.priceLists.getAll(); }
  createPriceList(list: PriceList): Observable<PriceList> { return this.priceLists.create(list); }

  getPrices(): Observable<Price[]> { return this.prices.getAll(); }
  createPrice(price: Price): Observable<Price> { return this.prices.create(price); }
  updatePrice(price: Price): Observable<Price> { return this.prices.update(price, price.id); }
}
