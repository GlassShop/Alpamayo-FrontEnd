import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError, delay} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {WorkOrder} from '../domain/model/work-order.entity';
import {SprintTask} from '../domain/model/sprint-task.entity';
import {WorkOrderAssembler, SprintTaskAssembler} from './workshop-assembler';
import {WorkOrdersResponse, SprintTasksResponse} from './workshop-response';

/**
 * HTTP endpoint client for Workshop work-order and sprint-task resources.
 * Currently returns empty responses (mock data lives in WorkshopStore).
 * Replace the `of({items:[]})` calls with real HTTP calls when the backend is ready.
 */
export class WorkshopApiEndpoint {
  private readonly workOrderAssembler = new WorkOrderAssembler();
  private readonly sprintTaskAssembler = new SprintTaskAssembler();

  constructor(private readonly http: HttpClient, private readonly baseUrl: string) {}

  getWorkOrders(): Observable<WorkOrder[]> {
    // TODO: replace with: return this.http.get<WorkOrdersResponse>(`${this.baseUrl}/work-orders`)
    return of<WorkOrdersResponse>({ items: [] }).pipe(
      delay(0),
      map(r => this.workOrderAssembler.toEntitiesFromResponse(r)),
      catchError(this.handleError('Failed to fetch work orders'))
    );
  }

  getSprintTasks(): Observable<SprintTask[]> {
    // TODO: replace with: return this.http.get<SprintTasksResponse>(`${this.baseUrl}/sprint-tasks`)
    return of<SprintTasksResponse>({ items: [] }).pipe(
      delay(0),
      map(r => this.sprintTaskAssembler.toEntitiesFromResponse(r)),
      catchError(this.handleError('Failed to fetch sprint tasks'))
    );
  }

  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      const msg = error.status === 404
        ? `${operation}: Resource not found`
        : error.error instanceof ErrorEvent
          ? `${operation}: ${error.error.message}`
          : `${operation}: ${error.status ?? 'Unexpected error'}`;
      return throwError(() => new Error(msg));
    };
  }
}

