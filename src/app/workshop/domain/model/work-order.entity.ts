export type WorkOrderStatus = 'queue' | 'in-process' | 'finishing' | 'completed' | 'delayed';
export type WorkOrderStage  = 'queue' | 'cutting' | 'assembly' | 'qc' | 'dispatch';

export interface WorkOrder {
  id: string;
  orderId: string;
  timeLabel: string;
  status: WorkOrderStatus;
  stage: WorkOrderStage;
  clientName: string;
  productDesc: string;
  progressPct: number;
  worker?: string;
  extraBadge?: string;
  actionBtn?: string;
}

export interface KanbanStage {
  key: WorkOrderStage;
  label: string;
  color: string;
}

