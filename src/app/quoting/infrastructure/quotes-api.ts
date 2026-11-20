import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {QuoteDraftSnapshot, SaleLine, SavedQuote} from '../domain/model/saved-quote.entity';
import {StockLevel} from '../../inventory/domain/model/stock-level.entity';
import {StockLevelAssembler} from '../../inventory/infrastructure/inventory-assemblers';
import {StockLevelResource} from '../../inventory/infrastructure/inventory-response';

/**
 * Saved quotes. The server assigns the number, the seller (from the token)
 * and the dates, and only returns the quotes the user may see.
 * The JSON shape is the domain shape; quotes saved before products or sales
 * existed come without `products`, `status` or `sale`, read as an open quote
 * without products.
 */
@Injectable({providedIn: 'root'})
export class QuotesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.quotesEndpointPath}`;
  private readonly levelAssembler = new StockLevelAssembler();

  getAll(): Observable<SavedQuote[]> {
    return this.http.get<SavedQuote[]>(this.url).pipe(map(list => list.map(withDefaults)));
  }

  getById(id: number): Observable<SavedQuote> {
    return this.http.get<SavedQuote>(`${this.url}/${id}`).pipe(map(withDefaults));
  }

  create(snapshot: QuoteDraftSnapshot): Observable<SavedQuote> {
    return this.http.post<SavedQuote>(this.url, snapshot).pipe(map(withDefaults));
  }

  update(id: number, snapshot: QuoteDraftSnapshot): Observable<SavedQuote> {
    return this.http.put<SavedQuote>(`${this.url}/${id}`, snapshot).pipe(map(withDefaults));
  }

  /** Marks the quote as sold: the server takes the units of every product line out of the site. */
  sell(id: number, command: SellCommand): Observable<StockChangeResult> {
    return this.http.post<StockChangeResource>(`${this.url}/${id}/sale`, command).pipe(map(r => this.toResult(r)));
  }

  /** Annuls the sale (CEO): the units go back to the site and the quote is open again. */
  cancelSale(id: number, reason: string): Observable<StockChangeResult> {
    return this.http.post<StockChangeResource>(`${this.url}/${id}/sale/cancel`, {reason}).pipe(map(r => this.toResult(r)));
  }

  private toResult(r: StockChangeResource): StockChangeResult {
    return {quote: withDefaults(r.quote), levels: r.levels.map(l => this.levelAssembler.toEntityFromResource(l))};
  }
}

/** Site the goods leave from and the inventory item of every product line. */
export interface SellCommand {
  siteId: number;
  lines: SaleLine[];
}

/** The quote after the change and the stock levels it touched. */
export interface StockChangeResult {
  quote: SavedQuote;
  levels: StockLevel[];
}

interface StockChangeResource {
  quote: SavedQuote;
  levels: StockLevelResource[];
}

function withDefaults(quote: SavedQuote): SavedQuote {
  return {
    ...quote, products: quote.products ?? [], status: quote.status ?? 'OPEN',
    sale: quote.sale ?? null, cancelledSales: quote.cancelledSales ?? [],
  };
}
