import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {DashboardApiEndpoint} from './dashboard-api-endpoint';
import {DashboardSummary} from '../domain/model/dashboard-summary.entity';

@Injectable({providedIn: 'root'})
export class SellersApi extends BaseApi {
  private readonly dashboardEndpoint: DashboardApiEndpoint;
  constructor(http: HttpClient) { super(); this.dashboardEndpoint = new DashboardApiEndpoint(http); }
  getDashboardSummary(): Observable<DashboardSummary> { return this.dashboardEndpoint.getSummary(); }
}

