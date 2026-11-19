import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {Series} from '../domain/model/series.entity';
import {Product} from '../domain/model/product.entity';
import {ProductPriceChange} from '../domain/model/product-price-change.entity';
import {ProductAssembler, SeriesAssembler, toProductPriceChange} from './products-assemblers';
import {
  ProductPriceChangeResource, ProductResource, ProductsResponse, SeriesResource, SeriesResponse
} from './products-response';
import {MAX_CHANGE_REASON} from './catalog-api';

const url = (path: string) => `${environment.apiBaseUrl}${path}`;

class SeriesApiEndpoint extends BaseApiEndpoint<Series, SeriesResource, SeriesResponse, SeriesAssembler> {
  constructor(http: HttpClient) { super(http, url(environment.seriesEndpointPath), new SeriesAssembler()); }
}

class ProductsApiEndpoint extends BaseApiEndpoint<Product, ProductResource, ProductsResponse, ProductAssembler> {
  constructor(http: HttpClient) { super(http, url(environment.productsEndpointPath), new ProductAssembler()); }
}

/**
 * Sale products besides glass (aluminium, accessories, acrylics…) and the
 * history of their public prices. Everyone reads products and may add one
 * without price; only the CEO sets prices and reads the history.
 */
@Injectable({providedIn: 'root'})
export class ProductsApi extends BaseApi {
  private readonly series: SeriesApiEndpoint;
  private readonly products: ProductsApiEndpoint;
  private readonly assembler = new ProductAssembler();
  private readonly productsUrl = url(environment.productsEndpointPath);
  private readonly historyUrl = url(environment.productPriceHistoryEndpointPath);

  constructor(private readonly http: HttpClient) {
    super();
    this.series = new SeriesApiEndpoint(http);
    this.products = new ProductsApiEndpoint(http);
  }

  getSeries(): Observable<Series[]> { return this.series.getAll(); }
  getProducts(): Observable<Product[]> { return this.products.getAll(); }
  createProduct(product: Product): Observable<Product> { return this.products.create(product); }

  /** Sets the public price (CEO); the server records it in the price history with the optional reason. */
  setPublicPrice(product: Product, publicPrice: number, reason?: string): Observable<Product> {
    const clean = reason?.trim().slice(0, MAX_CHANGE_REASON);
    return this.http.patch<ProductResource>(`${this.productsUrl}/${product.id}`, {publicPrice, ...(clean ? {changeReason: clean} : {})})
      .pipe(map(r => this.assembler.toEntityFromResource(r)));
  }

  /** GET /product-price-history (CEO only), newest first. */
  getPriceHistory(): Observable<ProductPriceChange[]> {
    return this.http.get<ProductPriceChangeResource[]>(this.historyUrl).pipe(map(list => list.map(toProductPriceChange)));
  }
}
