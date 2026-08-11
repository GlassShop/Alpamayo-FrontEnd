import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {SalesStore} from '../../../application/sales.store';
import {Product, ProductCategory} from '../../../domain/model/product.entity';
import {Customer} from '../../../domain/model/customer.entity';
import {QuoteType} from '../../../domain/model/quote.entity';
import {AddCustomerDialogComponent} from './add-customer-dialog/add-customer-dialog';
import {ProductDetailDialogComponent} from './product-detail-dialog/product-detail-dialog';

export type CategoryFilter = 'all' | ProductCategory;
interface CategoryTab { key: CategoryFilter; label: string; icon: string; }

@Component({
  selector: 'app-direct-sales',
  imports: [
    DecimalPipe, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule
  ],
  templateUrl: './direct-sales.html',
  styleUrl: './direct-sales.css'
})
export class DirectSales {
  readonly store  = inject(SalesStore);
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);
  readonly route  = inject(ActivatedRoute);

  readonly categories: CategoryTab[] = [
    { key: 'all',         label: 'ALL',        icon: 'apps' },
    { key: 'glass',       label: 'VIDRIOS',    icon: 'window' },
    { key: 'profiles',    label: 'PERFILES',   icon: 'view_column' },
    { key: 'accessories', label: 'ACCESORIOS', icon: 'settings' },
  ];

  /* ── catalogue ── */
  onCatalogSearch(event: Event): void {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  setCategory(key: CategoryFilter): void { this.store.setCategory(key); }

  addToSale(product: Product): void { this.store.addProduct(product); }

  openDetailDialog(product: Product): void {
    const ref = this.dialog.open(ProductDetailDialogComponent, {
      width: '520px',
      data: { product }
    });
    ref.afterClosed().subscribe((updated: Partial<Product> | undefined) => {
      if (updated) this.store.updateProduct(product.id, updated);
    });
  }

  /* ── customer ── */
  onCustomerSearch(event: Event): void {
    this.store.setCustomerQuery((event.target as HTMLInputElement).value);
  }

  pickCustomer(c: Customer): void { this.store.selectCustomer(c); }

  removeCustomer(): void { this.store.clearCustomer(); }

  openAddCustomerDialog(): void {
    const ref = this.dialog.open(AddCustomerDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe((customer: Customer | undefined) => {
      if (customer) this.store.addCustomer(customer);
    });
  }

  /* ── sale items ── */
  decrement(productId: string, current: number): void {
    this.store.updateQuantity(productId, current - 1);
  }

  increment(productId: string, current: number): void {
    this.store.updateQuantity(productId, current + 1);
  }

  onQtyChange(productId: string, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) this.store.updateQuantity(productId, val);
  }

  onPriceChange(productId: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.store.updateUnitPrice(productId, val);
  }

  removeItem(productId: string): void { this.store.removeItem(productId); }

  /* ── actions ── */
  canGenerate(): boolean {
    return this.store.saleItems().length > 0 && this.store.selectedCustomer() !== null;
  }

  private navigateToContract(type: QuoteType): void {
    if (this.store.saleItems().length === 0) return;
    this.store.setPendingContractType(type);
    this.router.navigate(['../contrato'], { relativeTo: this.route });
  }

  generateInvoice(): void { this.navigateToContract('factura'); }
  generateBoleta(): void  { this.navigateToContract('boleta'); }
  generateQuote(): void   { this.navigateToContract('cotizacion'); }
}

