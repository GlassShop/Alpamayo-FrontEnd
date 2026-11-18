import {Component, inject} from '@angular/core';
import {DecimalPipe, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {SalesStore} from '../../../application/sales.store';
import {Quote} from '../../../domain/model/quote.entity';

@Component({
  selector: 'app-adelantos',
  imports: [DecimalPipe, DatePipe, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './adelantos.html',
  styleUrl: './adelantos.css'
})
export class Adelantos {
  readonly store = inject(SalesStore);

  readonly typeLabelMap: Record<string, string> = {
    cotizacion: 'COTIZACIÓN',
    factura: 'FACTURA',
    boleta: 'BOLETA'
  };

  advances(): Quote[] {
    return this.store.savedQuotes().filter(q => q.partialPayment > 0);
  }

  balance(quote: Quote): number {
    return Math.max(0, quote.total - quote.partialPayment);
  }
}
