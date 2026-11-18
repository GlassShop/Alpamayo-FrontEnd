import {Component, inject} from '@angular/core';
import {CurrencyPipe, DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {DashboardStore} from '../../../application/dashboard.store';
import {SalesStore} from '../../../../sales/application/sales.store';

@Component({
  selector: 'app-cash-register',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './cash-register.html',
  styleUrl: './cash-register.css'
})
export class CashRegister {
  readonly dashboardStore = inject(DashboardStore);
  readonly salesStore = inject(SalesStore);
}
