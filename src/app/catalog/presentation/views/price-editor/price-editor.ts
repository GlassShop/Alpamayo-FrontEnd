import {Component, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';

/**
 * CEO view (permission `prices.manage`): sets the price per square foot of
 * every glass type in every price list and creates price lists. New glass
 * types are added from the catalog page by any role.
 */
@Component({
  selector: 'app-price-editor',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './price-editor.html',
  styleUrl: './price-editor.css'
})
export class PriceEditor implements OnInit {
  readonly catalog = inject(CatalogStore);

  readonly listForm = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  ngOnInit(): void { this.catalog.ensureLoaded(); }

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
    this.catalog.setPrice(glassTypeId, priceListId, value);
    if (!(value > 0)) input.value = current === null ? '' : current.toFixed(2);
  }

  addPriceList(): void {
    if (this.listForm.invalid) { this.listForm.markAllAsTouched(); return; }
    this.catalog.createPriceList(this.listForm.getRawValue().name);
    this.listForm.reset();
  }
}
