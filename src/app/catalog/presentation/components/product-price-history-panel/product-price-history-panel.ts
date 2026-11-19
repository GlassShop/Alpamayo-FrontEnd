import {Component, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {ProductPriceHistoryStore} from '../../../application/product-price-history.store';
import {ProductPriceChange} from '../../../domain/model/product-price-change.entity';
import {changePercent} from '../../../domain/model/price-change.entity';

/** CEO's history of product public prices: which product, when, from how much to how much, who and why. */
@Component({
  selector: 'app-product-price-history-panel',
  imports: [DatePipe, DecimalPipe, TranslatePipe, MatIconModule],
  templateUrl: './product-price-history-panel.html',
  styleUrl: '../price-history-panel/price-history-panel.css'
})
export class ProductPriceHistoryPanel {
  readonly history = inject(ProductPriceHistoryStore);

  percent(change: ProductPriceChange): number | null {
    return changePercent(change);
  }

  showCategory(): void { this.history.showCategory(this.history.category()); }
}
