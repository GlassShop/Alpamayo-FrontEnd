import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';

/**
 * Saved quotes. The server assigns the number, the seller (from the token)
 * and the dates, and only returns the quotes the user may see.
 * The JSON shape is the domain shape, so no assembler is needed.
 */
@Injectable({providedIn: 'root'})
export class QuotesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.quotesEndpointPath}`;

  getAll(): Observable<SavedQuote[]> {
    return this.http.get<SavedQuote[]>(this.url);
  }

  getById(id: number): Observable<SavedQuote> {
    return this.http.get<SavedQuote>(`${this.url}/${id}`);
  }

  create(snapshot: QuoteDraftSnapshot): Observable<SavedQuote> {
    return this.http.post<SavedQuote>(this.url, snapshot);
  }

  update(id: number, snapshot: QuoteDraftSnapshot): Observable<SavedQuote> {
    return this.http.put<SavedQuote>(`${this.url}/${id}`, snapshot);
  }
}
