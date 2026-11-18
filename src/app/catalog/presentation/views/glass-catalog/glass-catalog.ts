import {Component, inject, OnInit} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';
import {IamStore} from '../../../../iam/application/iam.store';

/**
 * Catalog for every role: glass types with their price in each list.
 * Staff with `catalog.add-product` can add a glass type; it stays
 * "Sin precio" until the CEO prices it.
 */
@Component({
  selector: 'app-glass-catalog',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, MatIconModule],
  templateUrl: './glass-catalog.html',
  styleUrl: './glass-catalog.css'
})
export class GlassCatalog implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly iam = inject(IamStore);

  readonly glassForm = new FormGroup({
    name:        new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    thicknessMm: new FormControl<number | null>(null, {validators: [Validators.required, Validators.min(0.1)]}),
    color:       new FormControl('', {nonNullable: true})
  });

  ngOnInit(): void { this.catalog.ensureLoaded(); }

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
