import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {GlassType} from '../domain/model/glass-type.entity';
import {PriceList} from '../domain/model/price-list.entity';
import {Price} from '../domain/model/price.entity';
import {GlassTypesApiEndpoint, PriceListsApiEndpoint, PricesApiEndpoint} from './catalog-api-endpoints';
import {PriceAssembler} from './catalog-assemblers';
import {PriceResource} from './catalog-response';

/** Longest reason the server keeps for a price change. */
export const MAX_CHANGE_REASON = 140;

/** Infrastructure facade for the catalog bounded context. */
@Injectable({providedIn: 'root'})
export class CatalogApi extends BaseApi {
  private readonly glassTypes: GlassTypesApiEndpoint;
  private readonly priceLists: PriceListsApiEndpoint;
  private readonly prices: PricesApiEndpoint;
  private readonly priceAssembler = new PriceAssembler();
  private readonly pricesUrl = `${environment.apiBaseUrl}${environment.pricesEndpointPath}`;

  constructor(private readonly http: HttpClient) {
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

  /** Creates a price; the server records it in the price history with the optional reason. */
  createPrice(price: Price, reason?: string): Observable<Price> {
    return this.http.post<PriceResource>(this.pricesUrl, this.withReason(price, reason))
      .pipe(map(r => this.priceAssembler.toEntityFromResource(r)));
  }

  /** Changes a price; the server records the previous and new value in the price history. */
  updatePrice(price: Price, reason?: string): Observable<Price> {
    return this.http.put<PriceResource>(`${this.pricesUrl}/${price.id}`, this.withReason(price, reason))
      .pipe(map(r => this.priceAssembler.toEntityFromResource(r)));
  }

  private withReason(price: Price, reason?: string): PriceResource & {changeReason?: string} {
    const clean = reason?.trim().slice(0, MAX_CHANGE_REASON);
    return {...this.priceAssembler.toResourceFromEntity(price), ...(clean ? {changeReason: clean} : {})};
  }
}
