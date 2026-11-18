import {Component, inject} from '@angular/core';
import {NgClass} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {DashboardStore} from '../../../application/dashboard.store';
import {SalesStore} from '../../../../sales/application/sales.store';

@Component({
  selector: 'app-direct-sales',
  imports: [
    NgClass, RouterLink,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './direct-sales.html',
  styleUrl: './direct-sales.css'
})
export class DirectSales {
  readonly dashboardStore = inject(DashboardStore);
  readonly salesStore = inject(SalesStore);

  onStockSearch(event: Event): void {
    this.dashboardStore.updateStockSearch((event.target as HTMLInputElement).value);
  }
}
