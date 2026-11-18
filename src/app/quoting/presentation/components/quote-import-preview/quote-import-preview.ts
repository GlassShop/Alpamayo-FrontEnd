import {Component, input, output} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {glassTypeLabel} from '../../../../catalog/domain/model/glass-type.entity';
import {QuoteLineView} from '../../../application/quoting.store';
import {RejectedRow} from '../../../domain/services/quote-sheet-parser';

/** One imported row, priced with the selected list. */
export interface ImportRowView {
  rowNumber: number;
  unitAssumed: boolean;
  view: QuoteLineView;
}

/**
 * Shows what an Excel file will add to the quote before anything changes:
 * the rows ready to import (priced), the rows with errors and why, and a
 * warning when the current lines are going to be replaced.
 */
@Component({
  selector: 'app-quote-import-preview',
  imports: [DecimalPipe, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './quote-import-preview.html',
  styleUrl: './quote-import-preview.css'
})
export class QuoteImportPreview {
  readonly fileName = input.required<string>();
  readonly rows = input.required<ImportRowView[]>();
  readonly rejected = input.required<RejectedRow[]>();
  readonly total = input.required<number>();
  readonly listName = input.required<string>();
  /** Lines currently in the quote, which the import will replace. */
  readonly currentLines = input(0);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  readonly label = glassTypeLabel;
}
