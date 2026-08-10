import {BaseApiEndpoint} from '../../shared/infrastructure/base-api-endpoint';
import {DashboardSummary} from '../domain/model/dashboard-summary.entity';
import {DashboardSummaryResource, DashboardSummaryResponse} from './dashboard-response';
import {DashboardAssembler} from './dashboard-assembler';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

const endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSellersDashboardEndpointPath}`;

export class DashboardApiEndpoint extends BaseApiEndpoint<DashboardSummary, DashboardSummaryResource, DashboardSummaryResponse, DashboardAssembler> {
  constructor(http: HttpClient) { super(http, endpointUrl, new DashboardAssembler()); }
  getSummary(): Observable<DashboardSummary> { return this.getById(1); }
}

