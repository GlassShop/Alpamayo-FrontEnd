import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {QuotingStore} from '../../../application/quoting.store';
import {QuoteExtra} from '../../../domain/model/quote-extra.entity';

/**
 * Additional concepts of the quote (installation, transport, accessories…):
 * rows the seller adds with description, quantity and price, outside the
 * CEO's glass catalog.
 */
@Component({
  selector: 'app-quote-extras',
  imports: [DecimalPipe, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './quote-extras.html',
  styleUrl: './quote-extras.css'
})
export class QuoteExtras {
  readonly quoting = inject(QuotingStore);

  onChange(id: number, field: 'description' | 'quantity' | 'unitPrice', event: Event): void {
    const input = event.target as HTMLInputElement;
    const changes: Partial<Omit<QuoteExtra, 'id'>> = field === 'description'
      ? {description: input.value}
      : {[field]: Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : (field === 'quantity' ? 0 : null)};
    this.quoting.updateExtra(id, changes);
  }
}
