import {Component, inject} from '@angular/core';
import {DecimalPipe, DatePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {SalesStore} from '../../../application/sales.store';
import {Quote} from '../../../domain/model/quote.entity';
import {DigitalContractDialogComponent} from '../direct-sales/digital-contract-dialog/digital-contract-dialog';

@Component({
  selector: 'app-cotizaciones',
  imports: [DecimalPipe, DatePipe, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './cotizaciones.html',
  styleUrl: './cotizaciones.css'
})
export class Cotizaciones {
  readonly store  = inject(SalesStore);
  readonly dialog = inject(MatDialog);

  readonly typeLabelMap: Record<string, string> = {
    cotizacion: 'COTIZACIÓN',
    factura: 'FACTURA',
    boleta: 'BOLETA'
  };

  readonly typeBadgeClass: Record<string, string> = {
    cotizacion: 'badge--quote',
    factura:    'badge--invoice',
    boleta:     'badge--boleta'
  };

  viewQuote(quote: Quote): void {
    this.dialog.open(DigitalContractDialogComponent, {
      width: '960px',
      maxWidth: '98vw',
      maxHeight: '92vh',
      data: {
        customer:  quote.customer,
        items:     quote.items,
        subtotal:  quote.subtotal,
        taxes:     quote.taxes,
        total:     quote.total,
        type:      quote.type
      }
    });
  }
}

