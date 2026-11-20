import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {ProductsStore} from '../../../../catalog/application/products.store';
import {productLabel, SALE_UNIT} from '../../../../catalog/domain/model/product.entity';
import {InventoryStore} from '../../../../inventory/application/inventory.store';
import {QuotingStore} from '../../../application/quoting.store';

export interface AddProductDialogData {
  productId: number;
}

/** Stock of the chosen colour in one site. */
interface SiteStock {
  siteId: number;
  name: string;
  /** Null while the colour was never counted in the site. */
  quantity: number | null;
}

/**
 * Adds a catalog product to the quote being built: the colour (from the
 * inventory items of the product), whole units, and the stock of each site
 * as a reference. The price is the public one whatever the colour.
 */
@Component({
  selector: 'app-add-product-dialog',
  imports: [DecimalPipe, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './add-product-dialog.html',
  styleUrl: './add-product-dialog.css'
})
export class AddProductDialog implements OnInit {
  private readonly data = inject<AddProductDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddProductDialog>);
  private readonly products = inject(ProductsStore);
  readonly inventory = inject(InventoryStore);
  private readonly quoting = inject(QuotingStore);

  readonly product = computed(() => this.products.product(this.data.productId));
  readonly label = computed(() => {
    const product = this.product();
    return product ? productLabel(product) : '';
  });
  readonly unitKey = computed(() => {
    const product = this.product();
    return product ? `catalog.products.unit.${SALE_UNIT[product.category]}` : '';
  });

  /** Inventory items of this product (one per colour, or per colour and size for sheets). */
  private readonly items = computed(() => this.inventory.items().filter(i => i.productId === this.data.productId));

  /** Colours that exist in the inventory for this product, without repeats. */
  readonly colors = computed(() => {
    const seen = new Map<string, string>();
    for (const item of this.items()) {
      const color = item.color.trim();
      if (color && !seen.has(color.toLowerCase())) seen.set(color.toLowerCase(), color);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly color = signal('');
  readonly quantity = signal<number | null>(1);
  readonly submitted = signal(false);

  readonly stock = computed<SiteStock[]>(() => {
    const color = this.color().trim().toLowerCase();
    const items = this.items().filter(i => i.color.trim().toLowerCase() === color);
    return this.inventory.sites().map(site => {
      const counted = items.map(i => this.inventory.quantityAt(i.id, site.id)).filter((q): q is number => q !== null);
      return {siteId: site.id, name: site.name, quantity: counted.length ? counted.reduce((a, b) => a + b, 0) : null};
    });
  });

  readonly validQuantity = computed(() => {
    const q = this.quantity();
    return q !== null && Number.isInteger(q) && q >= 1;
  });
  /** The colours come from the inventory: wait for it before adding, or a colourless row would slip in. */
  readonly needsColor = computed(() => !this.inventory.loaded() || (this.colors().length > 0 && !this.color()));
  readonly total = computed(() => {
    const price = this.product()?.publicPrice ?? null;
    return price !== null && this.validQuantity() ? Math.round(price * this.quantity()! * 100) / 100 : null;
  });

  ngOnInit(): void {
    this.products.ensureLoaded();
    this.inventory.ensureLoaded();
  }

  onColor(event: Event): void { this.color.set((event.target as HTMLSelectElement).value); }

  onQuantity(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.quantity.set(Number.isFinite(value) ? value : null);
  }

  step(delta: number): void {
    this.quantity.update(q => Math.max(1, (q !== null && Number.isInteger(q) ? q : 1) + delta));
  }

  add(): void {
    this.submitted.set(true);
    if (!this.product() || !this.validQuantity() || this.needsColor()) return;
    this.quoting.addProduct(this.data.productId, this.color(), this.quantity()!);
    this.dialogRef.close(true);
  }
}
