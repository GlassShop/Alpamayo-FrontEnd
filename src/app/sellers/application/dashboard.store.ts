import {computed, Injectable, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DashboardSummary} from '../domain/model/dashboard-summary.entity';
import {PendingTask} from '../domain/model/pending-task.entity';
import {TopProduct} from '../domain/model/top-product.entity';
import {RecentActivity} from '../domain/model/recent-activity.entity';
import {StockItem} from '../domain/model/stock-item.entity';
import {SellersApi} from '../infrastructure/sellers-api';

@Injectable({providedIn: 'root'})
export class DashboardStore {
  private readonly summarySignal = signal<DashboardSummary>(this.buildMock());
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string|null>(null);
  private readonly stockQuerySignal = signal('');

  readonly summary = this.summarySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pendingTasks = computed(() => this.summary().pendingTasks);
  readonly pendingTasksCount = computed(() => this.pendingTasks().length);
  readonly filteredStockItems = computed(() => {
    const q = this.stockQuerySignal().toLowerCase().trim();
    const items = this.summary().stockItems;
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q));
  });

  constructor(private sellersApi: SellersApi) { this.loadSummary(); }

  updateStockSearch(query: string): void { this.stockQuerySignal.set(query); }

  loadSummary(): void {
    this.loadingSignal.set(true);
    this.sellersApi.getDashboardSummary().pipe(takeUntilDestroyed()).subscribe({
      next: s => { this.summarySignal.set(s); this.loadingSignal.set(false); },
      error: () => { this.summarySignal.set(this.buildMock()); this.loadingSignal.set(false); }
    });
  }

  refresh(): void { this.loadSummary(); }

  private buildMock(): DashboardSummary {
    return new DashboardSummary({
      id:1, date:new Date(), todaySalesTotal:4734.34, shiftSalesTotal:2140,
      percentageVsYesterday:18, salesGoalPercentage:75, salesGoalCurrent:15000,
      salesGoalTarget:20000, daysRemainingInMonth:5, activeClientsCount:42, newClientsThisMonth:3,
      pendingTasks:[
        new PendingTask({id:1,description:'Confirmar abono 50% - Proj. Residencial',priority:'high'}),
        new PendingTask({id:2,description:'Reenviar proforma #0142 por WhatsApp',priority:'medium'}),
      ],
      topProducts:[
        new TopProduct({id:1,name:'Cristal Incoloro 6mm',detail:'Planchas',quantitySold:850,unit:'m²'}),
        new TopProduct({id:2,name:'Cristal Incoloro 8mm Temp.',detail:'',quantitySold:420,unit:'m²'}),
        new TopProduct({id:3,name:'Perfilería S25 Natural',detail:'1rp 6m',quantitySold:380,unit:'ud'}),
      ],
      recentActivities:[
        new RecentActivity({id:1,document:'Abono 50% - Proj. Residencial',client:'Inmobiliaria Sur',clientDetail:'Depósito Bancario',total:4100,status:'confirmed',timeAgo:'Hace 30 min'}),
        new RecentActivity({id:2,document:'FACT-001-4589',client:'Vidriería El Sol E.I.R.L.',clientDetail:'RUC: 2054...',total:8450,status:'paid',timeAgo:'Hace 2 horas'}),
        new RecentActivity({id:3,document:'BOL-002-8821',client:'Juan Pérez',clientDetail:'DNI: 0482...',total:1200,status:'credit',timeAgo:'Hace 3 horas'}),
        new RecentActivity({id:4,document:'Cita: Medición de Mamparas',client:'Torre Central',clientDetail:'Vista Técnica',total:null,status:'scheduled',timeAgo:'Mañana 08:00'}),
      ],
      stockItems:[
        new StockItem({id:1,name:'Cristal Incoloro 6mm',detail:'Plancha 3.51 x 2.14',quantity:45,unit:'Planchas',isLow:false}),
        new StockItem({id:2,name:'Cristal Templado 6mm',detail:'Plancha 2.40 x 1.20',quantity:18,unit:'Planchas',isLow:false}),
        new StockItem({id:3,name:'Cristal Bronce 4mm Temp.',detail:'Plancha 2.40 x 1.20',quantity:2,unit:'Planchas',isLow:true}),
        new StockItem({id:4,name:'Perfil S25 Natural',detail:'1rp 6m',quantity:12,unit:'Tras.',isLow:false}),
        new StockItem({id:5,name:'Cristal Incoloro 8mm',detail:'Plancha 3.51 x 2.14',quantity:22,unit:'Planchas',isLow:false}),
        new StockItem({id:6,name:'Perfil Codo 45° Aluminio',detail:'6m natural',quantity:8,unit:'Und',isLow:false}),
      ],
      stockAlerts:[{id:1,productName:'Cristal Bronce 4mm Temp.',remaining:2,unit:'planchas'}]
    });
  }
}

