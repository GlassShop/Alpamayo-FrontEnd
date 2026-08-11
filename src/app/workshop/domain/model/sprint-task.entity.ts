export type TaskStatus = 'blocked' | 'unpaid' | 'in-progress' | 'not-started';

export interface SprintTask {
  id: string;
  code?: string;
  title: string;
  worker: string;
  priority: number;  // 1-8
  status: TaskStatus;
  startDate?: string;
  endDate?: string;
  fileInfo?: string;
  ganttDay?: number;  // 0-6 (lun-dom), start day of the bar
  ganttSpan?: number; // number of days
  ganttColor?: string;
}

