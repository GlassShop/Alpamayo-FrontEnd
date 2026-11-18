import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';
import {PriceHistoryStore} from '../../../application/price-history.store';
import {PriceHistoryPanel} from '../../components/price-history-panel/price-history-panel';

/**
 * CEO view (permission `prices.manage`): sets the price per square foot of
 * every glass type in every price list, creates price lists and reviews the
 * price history. New glass types are added from the catalog page by any role.
 */
@Component({
  selector: 'app-price-editor',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule, MatTooltipModule, PriceHistoryPanel],
  templateUrl: './price-editor.html',
  styleUrl: './price-editor.css'
})
export class PriceEditor implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly history = inject(PriceHistoryStore);

  /** Optional reason attached to every price saved while it is filled in. */
  readonly reason = signal('');

  readonly listForm = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  ngOnInit(): void {
    this.catalog.ensureLoaded();
    this.history.showAll();
    this.history.load();
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
