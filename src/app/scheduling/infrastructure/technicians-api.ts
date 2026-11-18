import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Technician} from '../domain/model/technician.entity';

/** Technicians: everyone reads, only the CEO writes (enforced by the server). */
@Injectable({providedIn: 'root'})
export class TechniciansApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}${environment.techniciansEndpointPath}`;

  getAll(): Observable<Technician[]> { return this.http.get<Technician[]>(this.url); }

  create(technician: Omit<Technician, 'id'>): Observable<Technician> {
    return this.http.post<Technician>(this.url, technician);
  }

  update(id: number, changes: Partial<Omit<Technician, 'id'>>): Observable<Technician> {
    return this.http.patch<Technician>(`${this.url}/${id}`, changes);
  }
}
