import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {WorkshopApiEndpoint} from './workshop-api-endpoint';
import {WorkOrder} from '../domain/model/work-order.entity';
import {SprintTask} from '../domain/model/sprint-task.entity';
import {environment} from '../../../environments/environment';

/**
 * Infrastructure API service for the Workshop bounded context.
 *
 * Delegates HTTP communication to WorkshopApiEndpoint.
 * Currently returns mock/empty responses; replace the endpoint base URL
 * with the real backend URL (from environment) when the API is available.
 */
@Injectable({ providedIn: 'root' })
export class WorkshopApi extends BaseApi {
  private readonly endpoint: WorkshopApiEndpoint;

  constructor(http: HttpClient) {
    super();
    const baseUrl = `${environment.platformProviderApiBaseUrl}/workshop`;
    this.endpoint = new WorkshopApiEndpoint(http, baseUrl);
  }

  /** Fetch all active work orders from the backend. */
  getWorkOrders(): Observable<WorkOrder[]> {
    return this.endpoint.getWorkOrders();
  }

  /** Fetch all sprint tasks from the backend. */
  getSprintTasks(): Observable<SprintTask[]> {
    return this.endpoint.getSprintTasks();
  }
}


