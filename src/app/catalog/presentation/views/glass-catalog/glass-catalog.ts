import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';
import {ProductsStore} from '../../../application/products.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {TabBar} from '../../../../shared/presentation/components/tab-bar/tab-bar';
import {ProductTable} from '../../components/product-table/product-table';
import {NewProductForm} from '../../components/new-product-form/new-product-form';
import {PriceEditor} from '../../components/price-editor/price-editor';
import {CatalogTab, catalogTabs} from '../../catalog-tabs';

/** `?editar=precios` opens the catalog in price editing mode (CEO). */
const EDIT_PARAM = 'editar';
const EDIT_PRICES = 'precios';

/**
 * Catalog for every role: glass types with their price in each list, and
 * the other sale products (aluminium, accessories, acrylics…) with their
 * public price. Staff with `catalog.add-product` can add glass types and
 * products; they stay "Sin precio" until the CEO prices them. The CEO
 * switches the same page to "Editar precios" instead of opening another one.
 */
@Component({
  selector: 'app-glass-catalog',
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, MatIconModule, TabBar, ProductTable, NewProductForm, PriceEditor],
  templateUrl: './glass-catalog.html',
  styleUrl: './glass-catalog.css'
})
export class GlassCatalog implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly products = inject(ProductsStore);
  readonly iam = inject(IamStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly canEditPrices = this.iam.can('prices.manage');
  readonly editing = signal(this.canEditPrices && this.route.snapshot.queryParamMap.get(EDIT_PARAM) === EDIT_PRICES);
  readonly tab = signal<CatalogTab>('GLASS');
  /** While editing, each product tab shows how many products still have no price. */
  readonly tabs = computed(() => catalogTabs(tab => !this.editing() || tab === 'GLASS' || !this.products.loaded()
    ? null : this.products.missingPrices(tab)));
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

  /** Switches between the catalog and price editing, keeping the tab; the URL remembers it. */
  toggleEditing(): void {
    if (!this.canEditPrices) return;
    this.editing.update(on => !on);
    this.router.navigate([], {
      relativeTo: this.route, replaceUrl: true,
      queryParams: {[EDIT_PARAM]: this.editing() ? EDIT_PRICES : null}
    }).then();
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
