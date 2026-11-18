import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {PriceChange} from '../domain/model/price-change.entity';

interface PriceChangeResource extends Omit<PriceChange, 'reason' | 'previousPrice'> {
  previousPrice: number | null;
  reason?: string | null;
}

/** GET /price-history (CEO only). The server writes the history; the frontend only reads it. */
@Injectable({providedIn: 'root'})
export class PriceHistoryApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.priceHistoryEndpointPath}`;

  getAll(filter: {glassTypeId?: number; priceListId?: number} = {}): Observable<PriceChange[]> {
    let params = new HttpParams();
    if (filter.glassTypeId !== undefined) params = params.set('glassTypeId', filter.glassTypeId);
    if (filter.priceListId !== undefined) params = params.set('priceListId', filter.priceListId);
    return this.http.get<PriceChangeResource[]>(this.url, {params}).pipe(
      map(list => list.map(r => ({
        id: r.id, priceId: r.priceId, glassTypeId: r.glassTypeId, priceListId: r.priceListId,
        previousPrice: r.previousPrice === null ? null : Number(r.previousPrice), newPrice: Number(r.newPrice),
        changedAt: r.changedAt, changedBy: r.changedBy,
        ...(r.reason ? {reason: r.reason} : {}),
      })))
    );
  }
}
