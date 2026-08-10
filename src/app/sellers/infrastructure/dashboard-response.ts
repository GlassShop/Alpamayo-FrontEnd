import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

export interface PendingTaskResource extends BaseResource { id:number; description:string; priority:'high'|'medium'|'low'; }
export interface TopProductResource extends BaseResource { id:number; name:string; detail:string; quantitySold:number; unit:string; }
export interface RecentActivityResource extends BaseResource { id:number; document:string; client:string; clientDetail:string; total:number|null; status:'confirmed'|'paid'|'credit'|'scheduled'; timeAgo:string; }
export interface StockItemResource extends BaseResource { id:number; name:string; detail:string; quantity:number; unit:string; isLow:boolean; }
export interface StockAlertResource { id:number; productName:string; remaining:number; unit:string; }

export interface DashboardSummaryResource extends BaseResource {
  id:number; date:string; todaySalesTotal:number; shiftSalesTotal:number; percentageVsYesterday:number;
  salesGoalPercentage:number; salesGoalCurrent:number; salesGoalTarget:number; daysRemainingInMonth:number;
  activeClientsCount:number; newClientsThisMonth:number;
  pendingTasks:PendingTaskResource[]; topProducts:TopProductResource[];
  recentActivities:RecentActivityResource[]; stockItems:StockItemResource[]; stockAlerts:StockAlertResource[];
}
export interface DashboardSummaryResponse extends BaseResponse { summary: DashboardSummaryResource; }

