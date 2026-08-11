import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/** Raw resource received from the Workshop API for a work order */
export interface WorkOrderResource extends BaseResource {
  id: number;
  orderId: string;
  timeLabel: string;
  status: string;
  stage: string;
  clientName: string;
  productDesc: string;
  progressPct: number;
  extraBadge?: string;
  actionBtn?: string;
}

/** API response envelope for a list of work orders */
export interface WorkOrdersResponse extends BaseResponse {
  items: WorkOrderResource[];
}

/** Raw resource received from the Workshop API for a sprint task */
export interface SprintTaskResource extends BaseResource {
  id: number;
  code?: string;
  title: string;
  worker: string;
  priority: number;
  status: string;
  startDate?: string;
  endDate?: string;
  fileInfo?: string;
  ganttDay?: number;
  ganttSpan?: number;
  ganttColor?: string;
}

/** API response envelope for a list of sprint tasks */
export interface SprintTasksResponse extends BaseResponse {
  items: SprintTaskResource[];
}

