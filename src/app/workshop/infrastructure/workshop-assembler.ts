import {WorkOrder, WorkOrderStatus, WorkOrderStage} from '../domain/model/work-order.entity';
import {SprintTask, TaskStatus} from '../domain/model/sprint-task.entity';
import {WorkOrderResource, WorkOrdersResponse, SprintTaskResource, SprintTasksResponse} from './workshop-response';

/**
 * Assembler for WorkOrder: converts between API resources and domain entities.
 */
export class WorkOrderAssembler {
  toEntityFromResource(r: WorkOrderResource): WorkOrder {
    return {
      id:          String(r.id),
      orderId:     r.orderId,
      timeLabel:   r.timeLabel,
      status:      r.status  as WorkOrderStatus,
      stage:       r.stage   as WorkOrderStage,
      clientName:  r.clientName,
      productDesc: r.productDesc,
      progressPct: r.progressPct,
      extraBadge:  r.extraBadge,
      actionBtn:   r.actionBtn
    };
  }

  toEntitiesFromResponse(r: WorkOrdersResponse): WorkOrder[] {
    return (r.items ?? []).map(item => this.toEntityFromResource(item));
  }

  toResourceFromEntity(e: WorkOrder): WorkOrderResource {
    return {
      id:          parseInt(e.id, 10) || 0,
      orderId:     e.orderId,
      timeLabel:   e.timeLabel,
      status:      e.status,
      stage:       e.stage,
      clientName:  e.clientName,
      productDesc: e.productDesc,
      progressPct: e.progressPct,
      extraBadge:  e.extraBadge,
      actionBtn:   e.actionBtn
    };
  }
}

/**
 * Assembler for SprintTask: converts between API resources and domain entities.
 */
export class SprintTaskAssembler {
  toEntityFromResource(r: SprintTaskResource): SprintTask {
    return {
      id:         String(r.id),
      code:       r.code,
      title:      r.title,
      worker:     r.worker,
      priority:   r.priority,
      status:     r.status as TaskStatus,
      startDate:  r.startDate,
      endDate:    r.endDate,
      fileInfo:   r.fileInfo,
      ganttDay:   r.ganttDay,
      ganttSpan:  r.ganttSpan,
      ganttColor: r.ganttColor
    };
  }

  toEntitiesFromResponse(r: SprintTasksResponse): SprintTask[] {
    return (r.items ?? []).map(item => this.toEntityFromResource(item));
  }

  toResourceFromEntity(e: SprintTask): SprintTaskResource {
    return {
      id:         parseInt(e.id, 10) || 0,
      code:       e.code,
      title:      e.title,
      worker:     e.worker,
      priority:   e.priority,
      status:     e.status,
      startDate:  e.startDate,
      endDate:    e.endDate,
      fileInfo:   e.fileInfo,
      ganttDay:   e.ganttDay,
      ganttSpan:  e.ganttSpan,
      ganttColor: e.ganttColor
    };
  }
}

