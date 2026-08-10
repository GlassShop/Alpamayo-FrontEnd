import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {PendingTask} from './pending-task.entity';
import {TopProduct} from './top-product.entity';
import {RecentActivity} from './recent-activity.entity';
import {StockItem} from './stock-item.entity';

export interface StockAlert { id: number; productName: string; remaining: number; unit: string; }

export class DashboardSummary implements BaseEntity {
  private _id: number; private _date: Date;
  private _todaySalesTotal: number; private _shiftSalesTotal: number; private _percentageVsYesterday: number;
  private _salesGoalPercentage: number; private _salesGoalCurrent: number; private _salesGoalTarget: number;
  private _daysRemainingInMonth: number; private _activeClientsCount: number; private _newClientsThisMonth: number;
  private _pendingTasks: PendingTask[]; private _topProducts: TopProduct[];
  private _recentActivities: RecentActivity[]; private _stockItems: StockItem[]; private _stockAlerts: StockAlert[];

  constructor(s: {
    id:number; date:Date; todaySalesTotal:number; shiftSalesTotal:number; percentageVsYesterday:number;
    salesGoalPercentage:number; salesGoalCurrent:number; salesGoalTarget:number; daysRemainingInMonth:number;
    activeClientsCount:number; newClientsThisMonth:number; pendingTasks:PendingTask[]; topProducts:TopProduct[];
    recentActivities:RecentActivity[]; stockItems:StockItem[]; stockAlerts:StockAlert[];
  }) {
    this._id=s.id; this._date=s.date; this._todaySalesTotal=s.todaySalesTotal; this._shiftSalesTotal=s.shiftSalesTotal;
    this._percentageVsYesterday=s.percentageVsYesterday; this._salesGoalPercentage=s.salesGoalPercentage;
    this._salesGoalCurrent=s.salesGoalCurrent; this._salesGoalTarget=s.salesGoalTarget;
    this._daysRemainingInMonth=s.daysRemainingInMonth; this._activeClientsCount=s.activeClientsCount;
    this._newClientsThisMonth=s.newClientsThisMonth; this._pendingTasks=s.pendingTasks;
    this._topProducts=s.topProducts; this._recentActivities=s.recentActivities;
    this._stockItems=s.stockItems; this._stockAlerts=s.stockAlerts;
  }

  get id() { return this._id; }
  get date() { return this._date; }
  get todaySalesTotal() { return this._todaySalesTotal; }
  get shiftSalesTotal() { return this._shiftSalesTotal; }
  get percentageVsYesterday() { return this._percentageVsYesterday; }
  get salesGoalPercentage() { return this._salesGoalPercentage; }
  get salesGoalCurrent() { return this._salesGoalCurrent; }
  get salesGoalTarget() { return this._salesGoalTarget; }
  get daysRemainingInMonth() { return this._daysRemainingInMonth; }
  get activeClientsCount() { return this._activeClientsCount; }
  get newClientsThisMonth() { return this._newClientsThisMonth; }
  get pendingTasks() { return this._pendingTasks; }
  get pendingTasksCount() { return this._pendingTasks.length; }
  get topProducts() { return this._topProducts; }
  get recentActivities() { return this._recentActivities; }
  get stockItems() { return this._stockItems; }
  get stockAlerts() { return this._stockAlerts; }
}

