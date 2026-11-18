import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {WorkshopStore} from '../../../../workshop/application/workshop.store';
import {WorkOrderStatus} from '../../../../workshop/domain/model/work-order.entity';

@Component({
  selector: 'app-order-tracking',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTracking {
  readonly store = inject(WorkshopStore);

  readonly statusLabel: Record<WorkOrderStatus, string> = {
    'queue': 'En cola',
    'in-process': 'En proceso',
    'finishing': 'Finalizando',
    'completed': 'Completado',
    'delayed': 'Demorado'
  };

  recentOrders = () => this.store.workOrders().slice(0, 6);
}
