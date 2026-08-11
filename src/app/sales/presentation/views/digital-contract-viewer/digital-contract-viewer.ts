import {Component, inject, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SalesStore} from '../../../application/sales.store';
import {Quote} from '../../../domain/model/quote.entity';

@Component({
  selector: 'app-digital-contract-viewer',
  imports: [DecimalPipe, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './digital-contract-viewer.html',
  styleUrl: './digital-contract-viewer.css'
})
export class DigitalContractViewer implements OnInit {
  readonly store  = inject(SalesStore);
  readonly router = inject(Router);

  contractNumber = signal(Math.floor(1000000 + Math.random() * 9000000).toString());
  today = new Date();
  sellerName   = signal('Dylan Guillen G.');
  currency     = signal('Soles (PEN)');
  paymentMethod = signal('Efectivo / Transferencia BCP');
  partialPayment = signal(0);

  get saldoPagar(): number {
    return Math.max(0, this.store.total() - this.partialPayment());
  }

  get typeLabel(): string {
    const map: Record<string, string> = {
      cotizacion: 'COTIZACIÓN',
      factura:    'FACTURA',
      boleta:     'BOLETA'
    };
    return map[this.store.pendingContractType() ?? 'cotizacion'] ?? 'COTIZACIÓN';
  }

  ngOnInit(): void {
    if (this.store.saleItems().length === 0) {
      this.router.navigate(['/sellers/quotes/productos']);
    }
  }

  printTicket(): void { window.print(); }

  confirm(): void {
    const customer = this.store.selectedCustomer();
    if (!customer || this.store.saleItems().length === 0) return;

    const quote: Quote = {
      id:            crypto.randomUUID(),
      number:        this.contractNumber(),
      date:          this.today,
      type:          this.store.pendingContractType() ?? 'cotizacion',
      customer,
      items:         [...this.store.saleItems()],
      sellerName:    this.sellerName(),
      currency:      this.currency(),
      paymentMethod: this.paymentMethod(),
      partialPayment: this.partialPayment(),
      subtotal:      this.store.subtotal(),
      taxes:         this.store.taxes(),
      total:         this.store.total()
    };
    this.store.saveQuote(quote);
    this.router.navigate(['/sellers/quotes/cotizaciones']);
  }

  cancel(): void {
    this.router.navigate(['/sellers/quotes/productos']);
  }
}

