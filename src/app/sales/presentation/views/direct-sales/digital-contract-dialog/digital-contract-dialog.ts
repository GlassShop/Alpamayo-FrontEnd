import {Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DecimalPipe} from '@angular/common';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Customer} from '../../../../domain/model/customer.entity';
import {SaleItem} from '../../../../domain/model/sale-item.entity';
import {Quote, QuoteType} from '../../../../domain/model/quote.entity';

export interface DigitalContractDialogData {
  customer: Customer | null;
  items: SaleItem[];
  subtotal: number;
  taxes: number;
  total: number;
  type: QuoteType;
}

@Component({
  selector: 'app-digital-contract-dialog',
  imports: [FormsModule, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './digital-contract-dialog.html',
  styleUrl: './digital-contract-dialog.css'
})
export class DigitalContractDialogComponent {
  contractNumber: string;
  today = new Date();
  sellerName = 'Dylan Guillen G.';
  currency = 'Soles (PEN)';
  paymentMethod = 'Efectivo / Transferencia BCP';
  partialPayment = 0;

  get saldoPagar(): number {
    return Math.max(0, this.data.total - this.partialPayment);
  }

  get typeLabel(): string {
    const map: Record<QuoteType, string> = {
      cotizacion: 'COTIZACIÓN',
      factura: 'FACTURA',
      boleta: 'BOLETA'
    };
    return map[this.data.type];
  }

  constructor(
    private ref: MatDialogRef<DigitalContractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DigitalContractDialogData
  ) {
    this.contractNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  printTicket(): void { window.print(); }

  confirm(): void {
    if (!this.data.customer) return;
    const quote: Quote = {
      id: crypto.randomUUID(),
      number: this.contractNumber,
      date: this.today,
      type: this.data.type,
      customer: this.data.customer,
      items: [...this.data.items],
      sellerName: this.sellerName,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      partialPayment: this.partialPayment,
      subtotal: this.data.subtotal,
      taxes: this.data.taxes,
      total: this.data.total
    };
    this.ref.close(quote);
  }
}

