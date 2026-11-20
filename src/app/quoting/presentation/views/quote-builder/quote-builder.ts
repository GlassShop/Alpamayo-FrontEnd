import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../../catalog/application/catalog.store';
import {glassTypeLabel} from '../../../../catalog/domain/model/glass-type.entity';
import {QuotingStore, QuoteLineView} from '../../../application/quoting.store';
import {MEASURE_UNITS, MeasureUnit} from '../../../domain/model/measure-unit';
import {parseQuoteRows, ParsedLine, RejectedRow} from '../../../domain/services/quote-sheet-parser';
import {buildQuoteTemplate, TEMPLATE_FILE_NAME} from '../../../infrastructure/excel/quote-template.writer';
import {QuoteSheetReadError, readQuoteSheet} from '../../../infrastructure/excel/quote-sheet.reader';
import {ImportRowView, QuoteImportPreview} from '../../components/quote-import-preview/quote-import-preview';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {SaveQuoteDialog, SaveQuoteDialogData} from '../../components/save-quote-dialog/save-quote-dialog';
import {SavedQuote} from '../../../domain/model/saved-quote.entity';
import {QuoteExtras} from '../../components/quote-extras/quote-extras';
import {QuoteProducts} from '../../components/quote-products/quote-products';
import {ProductsStore} from '../../../../catalog/application/products.store';
import {SaleSettingsStore} from '../../../../catalog/application/sale-settings.store';
import {GLASS_PARAM} from '../../quote-cart.adapter';
import {priceNote} from '../../price-note';

const UNIT_KEY = 'alpamayo.quote-unit';

/** Result of reading an Excel file, waiting for the seller to confirm. */
interface ImportPreview {
  fileName: string;
  lines: ParsedLine[];
  rejected: RejectedRow[];
}

/**
 * Glass quoter. The seller picks a price list and a glass type, enters the
 * measures in cm, mm or inches and sees the billed size, square feet and total
 * before adding the line. Lines can also be imported from the customer's Excel.
 * Catalog products and extra concepts are added below the glass lines.
 * Catalog prices come from the CEO; the seller may type a final price within
 * the allowed discount.
 */
@Component({
  selector: 'app-quote-builder',
  imports: [DecimalPipe, RouterLink, TranslatePipe, MatIconModule, MatTooltipModule, QuoteImportPreview, QuoteProducts, QuoteExtras],
  templateUrl: './quote-builder.html',
  styleUrl: './quote-builder.css'
})
export class QuoteBuilder implements OnInit {
  readonly catalog = inject(CatalogStore);
  readonly quoting = inject(QuotingStore);
  private readonly dialog = inject(MatDialog);
  private readonly products = inject(ProductsStore);
  private readonly saleSettings = inject(SaleSettingsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly adjustment = priceNote;
  readonly label = glassTypeLabel;
  readonly units = MEASURE_UNITS;

  /** Quote just saved, to offer printing it. */
  readonly justSaved = signal<SavedQuote | null>(null);

  // ── draft line in the form ──
  readonly glassTypeId = signal<number | null>(null);
  readonly width       = signal<number | null>(null);
  readonly height      = signal<number | null>(null);
  /** Last unit chosen; kept for the next lines and remembered in this browser. */
  readonly unit        = signal<MeasureUnit>(readStoredUnit());
  readonly quantity    = signal(1);
  readonly reference   = signal('');
  /** Final price per square foot typed by the seller; null keeps the catalog price. */
  readonly finalPrice  = signal<number | null>(null);
  /** Line being edited, or null when the form adds a new one. */
  readonly editingId   = signal<number | null>(null);
  readonly submitted   = signal(false);

  // ── Excel import ──
  readonly importPreview = signal<ImportPreview | null>(null);
  readonly importError   = signal<string | null>(null);
  readonly excelBusy     = signal(false);

  readonly selectedListName = computed(() =>
    this.catalog.priceLists().find(l => l.id === this.quoting.priceListId())?.name ?? ''
  );

  readonly draftPreview = computed<QuoteLineView | null>(() => {
    const glassTypeId = this.glassTypeId();
    if (glassTypeId === null) return null;
    return this.quoting.preview({
      glassTypeId, width: this.width(), height: this.height(), unit: this.unit(), quantity: this.quantity(),
      adjustedPrice: this.finalPrice()
    });
  });

  readonly selectedGlassPrice = computed(() => {
    const id = this.glassTypeId();
    const list = this.quoting.priceListId();
    return id === null || list === null ? null : this.catalog.priceFor(id, list);
  });

  /** The draft can be added only when it is complete and priced. */
  readonly canSubmit = computed(() => this.draftPreview()?.issue === null);

  /** Imported rows priced with the selected list, for the preview table. */
  readonly importViews = computed<ImportRowView[]>(() =>
    (this.importPreview()?.lines ?? []).map(p => ({rowNumber: p.rowNumber, unitAssumed: p.unitAssumed, view: this.quoting.preview(p.line)}))
  );
  readonly importTotal = computed(() =>
    Math.round(this.importViews().reduce((acc, r) => acc + (r.view.total ?? 0), 0) * 100) / 100
  );

  constructor() {
    // Pre-select the first glass type once the catalog arrives.
    effect(() => {
      const first = this.catalog.glassTypes()[0];
      if (this.glassTypeId() === null && first) this.glassTypeId.set(first.id);
    });
  }

  ngOnInit(): void {
    this.catalog.ensureLoaded();
    this.products.ensureLoaded();
    this.saleSettings.ensureLoaded();
    // "Cotizar" on a glass of the catalog opens the quoter with that glass chosen.
    const glass = Number(this.route.snapshot.queryParamMap.get(GLASS_PARAM));
    if (Number.isInteger(glass) && glass > 0) {
      this.glassTypeId.set(glass);
      this.router.navigate([], {relativeTo: this.route, replaceUrl: true, queryParams: {[GLASS_PARAM]: null}}).then();
    }
  }

  onPriceList(event: Event): void {
    this.quoting.selectPriceList(Number((event.target as HTMLSelectElement).value));
    this.finalPrice.set(null);
  }

  onGlassType(event: Event): void {
    this.glassTypeId.set(Number((event.target as HTMLSelectElement).value));
    this.finalPrice.set(null);
  }

  /** An empty field goes back to the catalog price. */
  onFinalPrice(event: Event): void {
    const field = event.target as HTMLInputElement;
    const value = Math.round(field.valueAsNumber * 100) / 100;
    this.finalPrice.set(field.value === '' || !Number.isFinite(value) ? null : value);
  }

  onUnit(event: Event): void {
    const unit = (event.target as HTMLSelectElement).value as MeasureUnit;
    this.unit.set(unit);
    try { globalThis.localStorage?.setItem(UNIT_KEY, unit); } catch { /* storage unavailable */ }
  }

  onNumber(target: 'width' | 'height' | 'quantity', event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    const parsed = Number.isFinite(value) ? value : null;
    if (target === 'width') this.width.set(parsed);
    else if (target === 'height') this.height.set(parsed);
    else this.quantity.set(parsed ?? 0);
  }

  onReference(event: Event): void {
    this.reference.set((event.target as HTMLInputElement).value);
  }

  stepQuantity(delta: number): void {
    this.quantity.update(q => Math.max(1, (Number.isInteger(q) ? q : 1) + delta));
  }

  submit(): void {
    this.submitted.set(true);
    const glassTypeId = this.glassTypeId();
    if (!this.canSubmit() || glassTypeId === null) return;
    const reference = this.reference().trim();
    const details = {
      width: this.width(), height: this.height(), unit: this.unit(), quantity: this.quantity(),
      reference: reference || undefined, adjustedPrice: this.draftPreview()?.adjusted ? this.finalPrice() : null
    };
    const editing = this.editingId();
    if (editing === null) this.quoting.addLine(glassTypeId, details);
    else this.quoting.updateLine(editing, {glassTypeId, ...details});
    this.resetForm();
  }

  edit(view: QuoteLineView): void {
    this.editingId.set(view.line.id);
    this.glassTypeId.set(view.line.glassTypeId);
    this.width.set(view.line.width);
    this.height.set(view.line.height);
    this.unit.set(view.line.unit);
    this.quantity.set(view.line.quantity);
    this.reference.set(view.line.reference ?? '');
    this.finalPrice.set(view.adjusted ? view.pricePerSqFt : null);
  }

  remove(id: number): void {
    if (this.editingId() === id) this.resetForm();
    this.quoting.removeLine(id);
  }

  /** Starts a new quote (also leaves edit mode of a saved one). */
  clearQuote(): void {
    this.quoting.clear();
    this.justSaved.set(null);
    this.resetForm();
  }

  // ── saving ──

  openSaveDialog(): void {
    const data: SaveQuoteDialogData = {initial: this.quoting.editing()?.details};
    this.dialog.open<SaveQuoteDialog, SaveQuoteDialogData, SavedQuote>(SaveQuoteDialog, {
      data, width: '640px', maxWidth: 'calc(100vw - 32px)', autoFocus: '#sq-doc', panelClass: 'al-dialog'
    }).afterClosed().subscribe(saved => { if (saved) this.justSaved.set(saved); });
  }

  /** Keeps glass type and unit so the next line is faster to enter. */
  resetForm(): void {
    this.editingId.set(null);
    this.width.set(null);
    this.height.set(null);
    this.quantity.set(1);
    this.reference.set('');
    this.finalPrice.set(null);
    this.submitted.set(false);
  }

  // ── Excel ──

  async downloadTemplate(): Promise<void> {
    this.excelBusy.set(true);
    try {
      const blob = await buildQuoteTemplate(this.catalog.glassTypes());
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = TEMPLATE_FILE_NAME;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      this.excelBusy.set(false);
    }
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';                     // allow choosing the same file again
    if (!file) return;
    this.importError.set(null);
    this.importPreview.set(null);
    this.excelBusy.set(true);
    try {
      const rows = await readQuoteSheet(file);
      const {lines, rejected} = parseQuoteRows(rows, this.catalog.glassTypes());
      if (lines.length === 0 && rejected.length === 0) {
        this.importError.set('quoting.import.error.empty');
      } else {
        this.importPreview.set({fileName: file.name, lines, rejected});
      }
    } catch (error) {
      this.importError.set(error instanceof QuoteSheetReadError
        ? `quoting.import.error.${error.reason}` : 'quoting.import.error.not-excel');
    } finally {
      this.excelBusy.set(false);
    }
  }

  confirmImport(): void {
    const preview = this.importPreview();
    if (!preview || preview.lines.length === 0) return;
    this.quoting.replaceLines(preview.lines.map(p => p.line));
    this.importPreview.set(null);
    this.resetForm();
  }

  cancelImport(): void {
    this.importPreview.set(null);
    this.importError.set(null);
  }
}

function readStoredUnit(): MeasureUnit {
  try {
    const stored = globalThis.localStorage?.getItem(UNIT_KEY);
    if (stored && (MEASURE_UNITS as readonly string[]).includes(stored)) return stored as MeasureUnit;
  } catch { /* storage unavailable */ }
  return 'cm';
}
