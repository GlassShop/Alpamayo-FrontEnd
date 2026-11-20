import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {ProductsStore} from '../../../../catalog/application/products.store';
import {Product, productLabel, SALE_UNIT} from '../../../../catalog/domain/model/product.entity';
import {matchesSearch} from '../../../../inventory/presentation/inventory-rows';
import {QuotingStore, QuoteProductView} from '../../../application/quoting.store';
import {AddProductDialog, AddProductDialogData} from '../add-product-dialog/add-product-dialog';
import {priceNote} from '../../price-note';

/** Results shown at once while searching. */
const MAX_RESULTS = 8;

interface SearchResult {
  product: Product;
  label: string;
  unitKey: string;
  searchText: string;
}

/**
 * Catalog products on the quote (aluminium, accessories, acrylics…): a search
 * to add them and the rows already added, where the seller changes the whole
 * quantity or types a final unit price within the allowed discount.
 */
@Component({
  selector: 'app-quote-products',
  imports: [DecimalPipe, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './quote-products.html',
  styleUrl: './quote-products.css'
})
export class QuoteProducts implements OnInit {
  readonly quoting = inject(QuotingStore);
  readonly products = inject(ProductsStore);
  private readonly dialog = inject(MatDialog);

  readonly search = signal('');

  private readonly index = computed<SearchResult[]>(() => this.products.products().map(product => {
    const label = productLabel(product);
    return {
      product, label, unitKey: `catalog.products.unit.${SALE_UNIT[product.category]}`,
      searchText: `${label} ${this.products.seriesName(product.seriesId)}`.toLowerCase(),
    };
  }));

  readonly results = computed(() => {
    const term = this.search().trim();
    if (term.length < 2) return [];
    return this.index().filter(r => matchesSearch(r, term)).slice(0, MAX_RESULTS);
  });

  ngOnInit(): void { this.products.ensureLoaded(); }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }

  choose(productId: number): void {
    this.dialog.open<AddProductDialog, AddProductDialogData, boolean>(AddProductDialog, {
      data: {productId}, width: '520px', maxWidth: 'calc(100vw - 32px)', autoFocus: '#ap-qty', panelClass: 'al-dialog'
    }).afterClosed().subscribe(added => { if (added) this.search.set(''); });
  }

  onQuantity(id: number, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.quoting.updateProduct(id, {quantity: Number.isFinite(value) ? value : 0});
  }

  /** An empty field goes back to the catalog price. */
  onPrice(view: QuoteProductView, event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = field.value === '' ? null : Math.round(field.valueAsNumber * 100) / 100;
    this.quoting.updateProduct(view.line.id, {adjustedPrice: value !== null && Number.isFinite(value) ? value : null});
  }

  resetPrice(id: number): void { this.quoting.updateProduct(id, {adjustedPrice: null}); }

  readonly adjustment = priceNote;
}
