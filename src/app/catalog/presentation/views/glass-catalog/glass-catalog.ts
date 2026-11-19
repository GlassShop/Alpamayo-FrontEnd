import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';
import {ProductsStore} from '../../../application/products.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {TabBar} from '../../../../shared/presentation/components/tab-bar/tab-bar';
import {ProductTable} from '../../components/product-table/product-table';
import {NewProductForm} from '../../components/new-product-form/new-product-form';
import {CatalogTab, catalogTabs} from '../../catalog-tabs';

/**
 * Catalog for every role: glass types with their price in each list, and
 * the other sale products (aluminium, accessories, acrylics…) with their
 * public price. Staff with `catalog.add-product` can add glass types and
 * products; they stay "Sin precio" until the CEO prices them.
 */
@Component({
  selector: 'app-glass-catalog',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, MatIconModule, TabBar, ProductTable, NewProductForm],
  templateUrl: './glass-catalog.html',
  styleUrl: './glass-catalog.css'
})
export class GlassCatalog implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly products = inject(ProductsStore);
  readonly iam = inject(IamStore);

  readonly tab = signal<CatalogTab>('GLASS');
  readonly tabs = computed(() => catalogTabs(() => null));
  /** The tab as a product category, or null on the glass tab. */
  readonly productCategory = computed(() => {
    const tab = this.tab();
    return tab === 'GLASS' ? null : tab;
  });

  readonly glassForm = new FormGroup({
    name:        new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    thicknessMm: new FormControl<number | null>(null, {validators: [Validators.required, Validators.min(0.1)]}),
    color:       new FormControl('', {nonNullable: true})
  });

  ngOnInit(): void {
    this.catalog.ensureLoaded();
    this.products.ensureLoaded();
  }

  /** How many price lists still have no price for this glass type. */
  missingPrices(glassTypeId: number): number {
    return this.catalog.priceLists().filter(l => this.catalog.priceFor(glassTypeId, l.id) === null).length;
  }

  addGlassType(): void {
    if (this.glassForm.invalid) { this.glassForm.markAllAsTouched(); return; }
    const {name, thicknessMm, color} = this.glassForm.getRawValue();
    this.catalog.createGlassType(name, Number(thicknessMm), color);
    this.glassForm.reset();
  }
}
