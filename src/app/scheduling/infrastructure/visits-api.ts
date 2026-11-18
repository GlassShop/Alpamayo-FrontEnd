import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Visit, VisitDraft} from '../domain/model/visit.entity';
import {VisitStatus} from '../domain/model/visit-type';

/**
 * Technical visits. Everyone reads every visit; only the author or the CEO
 * may change one, and the server records each change. Visits are cancelled,
 * never deleted.
 */
@Injectable({providedIn: 'root'})
export class VisitsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.visitsEndpointPath}`;

  /** Visits between two dates (inclusive, "YYYY-MM-DD"). */
  getRange(from: string, to: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(this.url, {params: new HttpParams().set('from', from).set('to', to)});
  }

  create(draft: VisitDraft): Observable<Visit> {
    return this.http.post<Visit>(this.url, draft);
  }

  update(id: number, changes: Partial<VisitDraft> & {status?: VisitStatus}): Observable<Visit> {
    return this.http.patch<Visit>(`${this.url}/${id}`, changes);
  }
}
