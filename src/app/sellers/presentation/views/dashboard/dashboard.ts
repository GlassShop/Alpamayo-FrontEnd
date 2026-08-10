import {Component, inject} from '@angular/core';
import {CurrencyPipe, DecimalPipe, NgClass} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDividerModule} from '@angular/material/divider';
import {DashboardStore} from '../../../application/dashboard.store';
import {ActivityStatus} from '../../../domain/model/recent-activity.entity';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule,MatButtonModule,MatIconModule,MatTableModule,MatProgressBarModule,
    MatFormFieldModule,MatInputModule,MatDividerModule,CurrencyPipe,DecimalPipe,NgClass,RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  readonly store = inject(DashboardStore);
  readonly activityColumns = ['document','client','total','status'];
  readonly statusConfig: Record<ActivityStatus, {label:string; css:string}> = {
    confirmed:{label:'Confirmado',css:'badge--confirmed'},
    paid:     {label:'Pagado',    css:'badge--paid'},
    credit:   {label:'Crédito',  css:'badge--credit'},
    scheduled:{label:'Agendado', css:'badge--scheduled'}
  };
  getStatusConfig(status: string): {label:string; css:string} {
    return this.statusConfig[status as ActivityStatus] ?? {label: status, css: ''};
  }
  onStockSearch(event: Event): void {
    this.store.updateStockSearch((event.target as HTMLInputElement).value);
  }
}

