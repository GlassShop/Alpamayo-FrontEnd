import {Component, computed, effect, inject, input} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {ProductsStore} from '../../../application/products.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {ProductCategory, WEIGHT_CLASSES, WeightClass} from '../../../domain/model/product.entity';

/**
 * Adds a product of one category to the sale catalog, without price: like a
 * new glass type, it shows "Sin precio" until the CEO prices it.
 */
@Component({
  selector: 'app-new-product-form',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './new-product-form.html',
  styleUrl: './new-product-form.css'
})
export class NewProductForm {
  readonly products = inject(ProductsStore);
  readonly iam = inject(IamStore);

  readonly category = input.required<ProductCategory>();
  readonly weightClasses = WEIGHT_CLASSES;
  readonly needsSeries = computed(() => this.category() === 'ALUMINUM_SERIES');
  readonly hasBrand = computed(() => this.category() === 'ACCESSORY');
  readonly hasWeight = computed(() => this.category() === 'ALUMINUM_TRADITIONAL');

  readonly form = new FormGroup({
    code: new FormControl('', {nonNullable: true}),
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    seriesId: new FormControl<number | null>(null),
    brand: new FormControl('', {nonNullable: true}),
    weightClass: new FormControl<WeightClass>('LIGHT', {nonNullable: true})
  });

  constructor() {
    // The series is required only for aluminium by series.
    effect(() => {
      const control = this.form.controls.seriesId;
      control.setValidators(this.needsSeries() ? [Validators.required] : []);
      control.updateValueAndValidity();
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.products.createProduct({
      category: this.category(), code: value.code, name: value.name,
      seriesId: value.seriesId === null ? null : Number(value.seriesId), brand: value.brand, weightClass: value.weightClass
    });
    this.form.reset({code: '', name: '', seriesId: value.seriesId, brand: '', weightClass: 'LIGHT'});
  }
}
