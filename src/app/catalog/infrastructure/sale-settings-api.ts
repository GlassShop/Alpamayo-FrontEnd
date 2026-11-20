import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

/** Sale rules set by the CEO. */
export interface SaleSettings {
  /** Most a seller may lower a catalog price on a quote, in %; null while the CEO has not set it (no discount). */
  maxDiscountPercent: number | null;
}

/** Everyone reads the sale settings (sellers need the limit); only the CEO changes them. */
@Injectable({providedIn: 'root'})
export class SaleSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.saleSettingsEndpointPath}`;

  get(): Observable<SaleSettings> {
    return this.http.get<Partial<SaleSettings> | null>(this.url).pipe(map(toSettings));
  }

  setMaxDiscount(maxDiscountPercent: number | null): Observable<SaleSettings> {
    return this.http.put<Partial<SaleSettings> | null>(this.url, {maxDiscountPercent}).pipe(map(toSettings));
  }
}

function toSettings(resource: Partial<SaleSettings> | null): SaleSettings {
  const value = resource?.maxDiscountPercent;
  return {maxDiscountPercent: typeof value === 'number' && Number.isFinite(value) ? value : null};
}
