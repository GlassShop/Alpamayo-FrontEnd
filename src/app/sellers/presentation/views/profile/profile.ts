import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {DashboardStore} from '../../../application/dashboard.store';
import {SalesStore} from '../../../../sales/application/sales.store';
import {WorkshopStore} from '../../../../workshop/application/workshop.store';

@Component({
  selector: 'app-profile',
  imports: [
    DecimalPipe, RouterLink,
    MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  readonly dashboardStore = inject(DashboardStore);
  readonly salesStore = inject(SalesStore);
  readonly workshopStore = inject(WorkshopStore);

  readonly sellerName = 'Carlos M.';
  readonly sellerRole = 'Vendedor Mayorista';
}
