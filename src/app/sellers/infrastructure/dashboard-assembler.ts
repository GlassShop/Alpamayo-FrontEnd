import {DashboardSummaryResource,DashboardSummaryResponse,PendingTaskResource,TopProductResource,RecentActivityResource,StockItemResource} from './dashboard-response';
import {DashboardSummary} from '../domain/model/dashboard-summary.entity';
import {PendingTask} from '../domain/model/pending-task.entity';
import {TopProduct} from '../domain/model/top-product.entity';
import {RecentActivity} from '../domain/model/recent-activity.entity';
import {StockItem} from '../domain/model/stock-item.entity';
import {BaseAssembler} from '../../shared/infrastructure/base-assembler';

export class DashboardAssembler implements BaseAssembler<DashboardSummary, DashboardSummaryResource, DashboardSummaryResponse> {
  toEntitiesFromResponse(r: DashboardSummaryResponse): DashboardSummary[] { return [this.toEntityFromResource(r.summary)]; }
  toEntityFromResource(r: DashboardSummaryResource): DashboardSummary {
    return new DashboardSummary({
      id:r.id, date:new Date(r.date), todaySalesTotal:r.todaySalesTotal, shiftSalesTotal:r.shiftSalesTotal,
      percentageVsYesterday:r.percentageVsYesterday??0, salesGoalPercentage:r.salesGoalPercentage??0,
      salesGoalCurrent:r.salesGoalCurrent??0, salesGoalTarget:r.salesGoalTarget??0,
      daysRemainingInMonth:r.daysRemainingInMonth??0, activeClientsCount:r.activeClientsCount??0,
      newClientsThisMonth:r.newClientsThisMonth??0,
      pendingTasks:(r.pendingTasks??[]).map((t:PendingTaskResource)=>new PendingTask({id:t.id,description:t.description,priority:t.priority})),
      topProducts:(r.topProducts??[]).map((p:TopProductResource)=>new TopProduct({id:p.id,name:p.name,detail:p.detail,quantitySold:p.quantitySold,unit:p.unit})),
      recentActivities:(r.recentActivities??[]).map((a:RecentActivityResource)=>new RecentActivity({id:a.id,document:a.document,client:a.client,clientDetail:a.clientDetail,total:a.total,status:a.status,timeAgo:a.timeAgo})),
      stockItems:(r.stockItems??[]).map((s:StockItemResource)=>new StockItem({id:s.id,name:s.name,detail:s.detail,quantity:s.quantity,unit:s.unit,isLow:s.isLow})),
      stockAlerts:r.stockAlerts??[]
    });
  }
  toResourceFromEntity(e: DashboardSummary): DashboardSummaryResource {
    return {
      id:e.id, date:e.date.toISOString(), todaySalesTotal:e.todaySalesTotal, shiftSalesTotal:e.shiftSalesTotal,
      percentageVsYesterday:e.percentageVsYesterday, salesGoalPercentage:e.salesGoalPercentage,
      salesGoalCurrent:e.salesGoalCurrent, salesGoalTarget:e.salesGoalTarget,
      daysRemainingInMonth:e.daysRemainingInMonth, activeClientsCount:e.activeClientsCount, newClientsThisMonth:e.newClientsThisMonth,
      pendingTasks:e.pendingTasks.map(t=>({id:t.id,description:t.description,priority:t.priority})),
      topProducts:e.topProducts.map(p=>({id:p.id,name:p.name,detail:p.detail,quantitySold:p.quantitySold,unit:p.unit})),
      recentActivities:e.recentActivities.map(a=>({id:a.id,document:a.document,client:a.client,clientDetail:a.clientDetail,total:a.total,status:a.status,timeAgo:a.timeAgo})),
      stockItems:e.stockItems.map(s=>({id:s.id,name:s.name,detail:s.detail,quantity:s.quantity,unit:s.unit,isLow:s.isLow})),
      stockAlerts:e.stockAlerts
    } as DashboardSummaryResource;
  }
}

