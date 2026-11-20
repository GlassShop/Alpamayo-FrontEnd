import {Component, computed, effect, inject, input, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';
import {PriceHistoryStore} from '../../../application/price-history.store';
import {ProductsStore} from '../../../application/products.store';
import {ProductPriceHistoryStore} from '../../../application/product-price-history.store';
import {PriceHistoryPanel} from '../../components/price-history-panel/price-history-panel';
import {ProductTable} from '../../components/product-table/product-table';
import {ProductPriceHistoryPanel} from '../../components/product-price-history-panel/product-price-history-panel';
import {CatalogTab} from '../../catalog-tabs';
import {DiscountLimit} from '../discount-limit/discount-limit';

/**
 * The catalog in "Editar precios" mode (CEO, permission `prices.manage`):
 * sets the price per square foot of every glass type in every price list,
 * creates price lists, sets the public price of the other products
 * (aluminium, accessories, acrylics…) and reviews both price histories, for
 * the tab chosen in the catalog. Above it, the maximum discount sellers may
 * give on a quote. New glass types and products are added in
 * the normal mode by any role.
 */
@Component({
  selector: 'app-price-editor',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule, MatTooltipModule, PriceHistoryPanel, ProductTable,
    ProductPriceHistoryPanel, DiscountLimit],
  templateUrl: './price-editor.html',
  styleUrl: './price-editor.css'
})
export class PriceEditor implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly history = inject(PriceHistoryStore);
  readonly products = inject(ProductsStore);
  readonly productHistory = inject(ProductPriceHistoryStore);

  /** Tab chosen in the catalog. */
  readonly tab = input.required<CatalogTab>();
  readonly productCategory = computed(() => {
    const tab = this.tab();
    return tab === 'GLASS' ? null : tab;
  });

  /** Optional reason attached to every price saved while it is filled in. */
  readonly reason = signal('');

  readonly listForm = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  constructor() {
    effect(() => {
      const tab = this.tab();
      if (tab !== 'GLASS') this.productHistory.showCategory(tab);
    });
  }

  ngOnInit(): void {
    this.catalog.ensureLoaded();
    this.products.ensureLoaded();
    this.history.showAll();
    this.history.load();
    this.productHistory.load();
  }

  onReason(event: Event): void { this.reason.set((event.target as HTMLInputElement).value); }

  /** Saves a cell when the CEO leaves it or presses Enter, only if the value changed. */
  onPriceCommit(glassTypeId: number, priceListId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const current = this.catalog.priceFor(glassTypeId, priceListId);
    if (input.value === '') {
      input.value = current === null ? '' : current.toFixed(2);
      return;
    }
    const value = Math.round(input.valueAsNumber * 100) / 100;
    if (value === current) return;
    this.catalog.setPrice(glassTypeId, priceListId, value, this.reason() || undefined);
    if (!(value > 0)) input.value = current === null ? '' : current.toFixed(2);
  }

  /** Filters the history to one cell and scrolls to it. */
  showHistory(glassTypeId: number, priceListId: number): void {
    this.history.showFor(glassTypeId, priceListId);
    globalThis.document?.getElementById('price-history')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  addPriceList(): void {
    if (this.listForm.invalid) { this.listForm.markAllAsTouched(); return; }
    this.catalog.createPriceList(this.listForm.getRawValue().name);
    this.listForm.reset();
  }
}
