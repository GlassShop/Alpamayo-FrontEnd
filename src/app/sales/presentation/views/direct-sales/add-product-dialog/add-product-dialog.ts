import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Product, ProductCategory} from '../../../../domain/model/product.entity';

@Component({
  selector: 'app-add-product-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="apd-header">
      <mat-icon>inventory_2</mat-icon>
      <h2 mat-dialog-title>Nuevo Producto</h2>
    </div>
    <mat-dialog-content>
      <div class="apd-form">
        <label class="apd-label">Nombre</label>
        <input class="apd-input" [(ngModel)]="name" placeholder="Ej. Vidrio Templado 8mm"/>

        <label class="apd-label">SKU</label>
        <input class="apd-input" [(ngModel)]="sku" placeholder="Ej. TG-8MM-CLR"/>

        <label class="apd-label">Categoría</label>
        <select class="apd-select" [(ngModel)]="category">
          <option value="glass">Vidrios</option>
          <option value="profiles">Perfiles</option>
          <option value="accessories">Accesorios</option>
        </select>

        <label class="apd-label">Precio (S/)</label>
        <input class="apd-input" type="number" min="0" step="0.01" [(ngModel)]="price"/>

        <label class="apd-label">Stock</label>
        <input class="apd-input" type="number" min="0" [(ngModel)]="stock"/>

        <label class="apd-label">Unidad de Stock</label>
        <input class="apd-input" [(ngModel)]="stockUnit" placeholder="m², units, bars…"/>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="apd-cancel">Cancelar</button>
      <button mat-flat-button class="apd-save" [disabled]="!isValid()" (click)="save()">
        <mat-icon>save</mat-icon>
        Guardar Producto
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .apd-header { display:flex; align-items:center; gap:10px; padding:16px 24px 0; }
    .apd-header mat-icon { color:#3b82f6; font-size:22px; width:22px; height:22px; }
    .apd-header h2 { margin:0; font-size:1rem; font-weight:800; color:#0f172a; }
    mat-dialog-content { padding:12px 24px !important; }
    .apd-form { display:flex; flex-direction:column; gap:8px; }
    .apd-label { font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.04em; margin-bottom:-4px; }
    .apd-input, .apd-select {
      height:36px; border:1px solid #e2e8f0; border-radius:8px;
      padding:0 12px; font-size:0.83rem; color:#1e293b; outline:none;
      background:#f8fafc; width:100%; box-sizing:border-box;
    }
    .apd-input:focus, .apd-select:focus { border-color:#3b82f6; background:#ffffff; }
    mat-dialog-actions { padding:8px 24px 16px !important; }
    .apd-cancel { color:#64748b !important; font-weight:600 !important; }
    .apd-save { background:#3b82f6 !important; color:#fff !important; font-weight:700 !important; border-radius:8px !important; gap:4px; display:flex; align-items:center; }
    .apd-save mat-icon { font-size:16px; width:16px; height:16px; }
  `]
})
export class AddProductDialogComponent {
  name      = '';
  sku       = '';
  category: ProductCategory = 'glass';
  price     = 0;
  stock     = 0;
  stockUnit = 'm²';

  constructor(private ref: MatDialogRef<AddProductDialogComponent>) {}

  isValid(): boolean {
    return !!(this.name.trim() && this.sku.trim() && this.price > 0);
  }

  save(): void {
    if (!this.isValid()) return;
    const product: Product = {
      id: `p-${Date.now()}`,
      name: this.name.trim().toUpperCase(),
      sku: this.sku.trim().toUpperCase(),
      category: this.category,
      price: this.price,
      stock: this.stock,
      stockUnit: this.stockUnit.trim() || 'units'
    };
    this.ref.close(product);
  }
}

