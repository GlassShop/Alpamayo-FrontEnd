import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {DocType} from '../domain/model/document-id';

/** Holder of a DNI or RUC as returned by the lookup. */
export interface DocumentHolder {
  docType: DocType;
  docNumber: string;
  name: string;
  address?: string;
  phone?: string;
}

interface DocumentHolderResource {
  docType: string;
  docNumber: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

/**
 * GET /document-lookup/{DNI|RUC}/{number}
 *
 * The backend proxies RENIEC/SUNAT (their credentials can never live in the
 * frontend) and also returns customers from previous quotes. 404 = not found.
 */
@Injectable({providedIn: 'root'})
export class DocumentLookupApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.documentLookupEndpointPath}`;

  find(type: DocType, number: string): Observable<DocumentHolder> {
    return this.http.get<DocumentHolderResource>(`${this.url}/${type}/${number}`).pipe(
      map(r => ({
        docType: type, docNumber: number, name: r.name,
        ...(r.address ? {address: r.address} : {}),
        ...(r.phone ? {phone: r.phone} : {}),
      }))
    );
  }
}
