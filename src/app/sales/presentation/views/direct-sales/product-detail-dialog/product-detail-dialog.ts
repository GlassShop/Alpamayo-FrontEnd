import {Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Product, ProductCategory} from '../../../../domain/model/product.entity';

export interface ProductDetailDialogData { product: Product; }

@Component({
  selector: 'app-product-detail-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pdd-header">
      <mat-icon>inventory_2</mat-icon>
      <h2 mat-dialog-title>Detalle del Producto</h2>
    </div>

    <mat-dialog-content>
      <!-- image preview -->
      <div class="pdd-img-section">
        @if (imagePreview) {
          <img [src]="imagePreview" alt="preview" class="pdd-img-preview"/>
        } @else {
          <div class="pdd-img-empty">
            <mat-icon>image</mat-icon>
            <span>Sin imagen</span>
          </div>
        }
        <div class="pdd-img-input-row">
          <input class="pdd-input" [(ngModel)]="imageUrl"
                 placeholder="Pega URL de imagen aquí..."
                 (input)="onImageInput()"/>
          @if (imageUrl) {
            <button mat-icon-button class="pdd-clear-img" (click)="clearImage()" title="Quitar imagen">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      </div>

      <!-- info grid -->
      <div class="pdd-grid">
        <div class="pdd-field">
          <span class="pdd-label">Nombre</span>
          <input class="pdd-input" [(ngModel)]="name"/>
        </div>
        <div class="pdd-field">
          <span class="pdd-label">SKU</span>
          <input class="pdd-input" [(ngModel)]="sku"/>
        </div>
        <div class="pdd-field">
          <span class="pdd-label">Categoría</span>
          <select class="pdd-select" [(ngModel)]="category">
            <option value="glass">Vidrios</option>
            <option value="profiles">Perfiles</option>
            <option value="accessories">Accesorios</option>
          </select>
        </div>
        <div class="pdd-field">
          <span class="pdd-label">Unidad</span>
          <input class="pdd-input" [(ngModel)]="stockUnit"/>
        </div>
        <div class="pdd-field">
          <span class="pdd-label">Precio (S/)</span>
          <input class="pdd-input" type="number" min="0" step="0.01" [(ngModel)]="price"/>
        </div>
        <div class="pdd-field">
          <span class="pdd-label">Stock</span>
          <input class="pdd-input" type="number" min="0" [(ngModel)]="stock"/>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="pdd-cancel">Cancelar</button>
      <button mat-flat-button class="pdd-save" (click)="save()">
        <mat-icon>save</mat-icon>
        Guardar Cambios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .pdd-header { display:flex; align-items:center; gap:10px; padding:16px 24px 0; }
    .pdd-header mat-icon { color:#3b82f6; font-size:22px; width:22px; height:22px; }
    .pdd-header h2 { margin:0; font-size:1rem; font-weight:800; color:#0f172a; }
    mat-dialog-content { padding:12px 24px !important; }

    /* image section */
    .pdd-img-section { margin-bottom:14px; display:flex; flex-direction:column; gap:8px; }
    .pdd-img-preview { width:100%; height:160px; object-fit:cover; border-radius:10px; border:1px solid #e2e8f0; }
    .pdd-img-empty {
      width:100%; height:130px; border-radius:10px; border:2px dashed #e2e8f0;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:6px; color:#94a3b8; background:#f8fafc;
    }
    .pdd-img-empty mat-icon { font-size:36px; width:36px; height:36px; }
    .pdd-img-empty span { font-size:0.78rem; }
    .pdd-img-input-row { display:flex; align-items:center; gap:4px; }
    .pdd-clear-img { width:32px !important; height:32px !important; flex-shrink:0; }
    .pdd-clear-img mat-icon { font-size:16px; width:16px; height:16px; color:#ef4444; }

    /* grid */
    .pdd-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .pdd-field { display:flex; flex-direction:column; gap:4px; }
    .pdd-label { font-size:0.68rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.04em; }
    .pdd-input, .pdd-select {
      height:34px; border:1px solid #e2e8f0; border-radius:8px;
      padding:0 10px; font-size:0.82rem; color:#1e293b; outline:none;
      background:#f8fafc; width:100%; box-sizing:border-box;
    }
    .pdd-input:focus, .pdd-select:focus { border-color:#3b82f6; background:#fff; }

    mat-dialog-actions { padding:8px 24px 16px !important; }
    .pdd-cancel { color:#64748b !important; font-weight:600 !important; }
    .pdd-save { background:#3b82f6 !important; color:#fff !important; font-weight:700 !important; border-radius:8px !important; display:flex; align-items:center; gap:4px; }
    .pdd-save mat-icon { font-size:16px; width:16px; height:16px; }
  `]
})
export class ProductDetailDialogComponent {
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  stockUnit: string;
  imageUrl: string;
  imagePreview: string;

  constructor(
    private ref: MatDialogRef<ProductDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDetailDialogData
  ) {
    const p = data.product;
    this.name      = p.name;
    this.sku       = p.sku;
    this.category  = p.category;
    this.price     = p.price;
    this.stock     = p.stock;
    this.stockUnit = p.stockUnit;
    this.imageUrl  = p.imageUrl ?? '';
    this.imagePreview = p.imageUrl ?? '';
  }

  onImageInput(): void { this.imagePreview = this.imageUrl; }
  clearImage(): void { this.imageUrl = ''; this.imagePreview = ''; }

  save(): void {
    const updated: Partial<Product> = {
      name:      this.name.trim(),
      sku:       this.sku.trim(),
      category:  this.category,
      price:     this.price,
      stock:     this.stock,
      stockUnit: this.stockUnit.trim(),
      imageUrl:  this.imageUrl.trim() || undefined
    };
    this.ref.close(updated);
  }
}

