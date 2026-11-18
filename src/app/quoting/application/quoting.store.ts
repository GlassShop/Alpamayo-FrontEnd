import {computed, inject, Injectable, signal} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {GlassType} from '../../catalog/domain/model/glass-type.entity';
import {QuoteLine} from '../domain/model/quote-line.entity';
import {
  igvOf, lineSquareFeet, lineTotal, piecePrice, pieceSquareFeet, roundMoney, roundUpToFive, subtotalWithoutIgv,
  toCentimeters
} from '../domain/services/square-foot-calculator';

/** Why a line cannot be priced yet. */
export type LineIssue = 'missing-measures' | 'invalid-quantity' | 'no-price';

/** A line as entered, before it gets an id. */
export type QuoteLineDraft = Omit<QuoteLine, 'id'>;

/** A quote line enriched with everything the view needs to display. */
export interface QuoteLineView {
  line: QuoteLine;
  glass: GlassType | undefined;
  /** Measures converted to cm (before rounding). */
  widthCm: number | null;
  heightCm: number | null;
  /** Billed measures: converted to cm and rounded up to 5 cm. */
  roundedWidthCm: number | null;
  roundedHeightCm: number | null;
  /** Square feet of one piece, rounded to 2 decimals for display. */
  pieceSquareFeet: number | null;
  /** Square feet of the line, rounded to 2 decimals for display. */
  squareFeet: number | null;
  /** Price of one piece, rounded to cents for display. */
  piecePrice: number | null;
  /** Price per square foot set by the CEO for the selected list. */
  pricePerSqFt: number | null;
  total: number | null;
  issue: LineIssue | null;
}

/**
 * State of the glass quote being built by the seller.
 *
 * @remarks
 * Prices are read from {@link CatalogStore} for the selected price list and
 * can never be edited here. Totals update instantly as measures change.
 * Each line keeps the unit it was entered in (cm, mm or inches).
 */
@Injectable({providedIn: 'root'})
export class QuotingStore {
  private readonly catalog = inject(CatalogStore);
  private nextId = 1;

  private readonly linesSignal = signal<QuoteLine[]>([]);
  private readonly selectedPriceListIdSignal = signal<number | null>(null);

  readonly lines = this.linesSignal.asReadonly();

  /** Selected price list, defaulting to the first one in the catalog. */
  readonly priceListId = computed(() => {
    const lists = this.catalog.priceLists();
    const selected = this.selectedPriceListIdSignal();
    if (selected !== null && lists.some(l => l.id === selected)) return selected;
    return lists[0]?.id ?? null;
  });

  readonly lineViews = computed<QuoteLineView[]>(() => {
    const listId = this.priceListId();
    const glassById = new Map(this.catalog.glassTypes().map(g => [g.id, g]));
    return this.linesSignal().map(line => this.toView(line, glassById.get(line.glassTypeId), listId));
  });

  /** IGV-included total of every priced line. */
  readonly total = computed(() =>
    roundMoney(this.lineViews().reduce((acc, v) => acc + (v.total ?? 0), 0))
  );
  readonly subtotal = computed(() => subtotalWithoutIgv(this.total()));
  readonly igv      = computed(() => igvOf(this.total()));
  /** Number of glass pieces in the quote (sum of quantities of complete lines). */
  readonly pieces = computed(() =>
    this.lineViews().reduce((acc, v) => acc + (v.squareFeet !== null ? v.line.quantity : 0), 0)
  );
  readonly totalSquareFeet = computed(() =>
    roundMoney(this.lineViews().reduce((acc, v) => acc + (v.squareFeet ?? 0), 0))
  );
  /** True when every line is complete and priced. */
  readonly isComplete = computed(() =>
    this.lineViews().length > 0 && this.lineViews().every(v => v.issue === null)
  );

  selectPriceList(priceListId: number): void {
    this.selectedPriceListIdSignal.set(priceListId);
  }

  /** Adds a line, optionally with its measures, and returns its id. */
  addLine(glassTypeId: number, details: Partial<Omit<QuoteLineDraft, 'glassTypeId'>> = {}): number {
    const id = this.nextId++;
    this.linesSignal.update(lines => [...lines, {...emptyLine(glassTypeId), ...details, id}]);
    return id;
  }

  updateLine(id: number, changes: Partial<QuoteLineDraft>): void {
    this.linesSignal.update(lines => lines.map(l => l.id === id ? {...l, ...changes} : l));
  }

  removeLine(id: number): void {
    this.linesSignal.update(lines => lines.filter(l => l.id !== id));
  }

  /** Replaces every line of the quote, e.g. with the rows imported from Excel. */
  replaceLines(drafts: QuoteLineDraft[]): void {
    this.linesSignal.set(drafts.map(d => ({...d, id: this.nextId++})));
  }

  clear(): void { this.linesSignal.set([]); }

  /**
   * Prices a draft line with the selected list without adding it,
   * so the form can show the result before the seller confirms.
   */
  preview(draft: QuoteLineDraft): QuoteLineView {
    const glass = this.catalog.glassTypes().find(g => g.id === draft.glassTypeId);
    return this.toView({...draft, id: 0}, glass, this.priceListId());
  }

  private toView(line: QuoteLine, glass: GlassType | undefined, listId: number | null): QuoteLineView {
    const price = listId === null ? null : this.catalog.priceFor(line.glassTypeId, listId);
    const widthCm  = isPositive(line.width)  ? toCentimeters(line.width,  line.unit) : null;
    const heightCm = isPositive(line.height) ? toCentimeters(line.height, line.unit) : null;
    const view: QuoteLineView = {
      line, glass, pricePerSqFt: price, widthCm, heightCm,
      roundedWidthCm:  widthCm  !== null ? roundUpToFive(widthCm)  : null,
      roundedHeightCm: heightCm !== null ? roundUpToFive(heightCm) : null,
      pieceSquareFeet: null, squareFeet: null, piecePrice: null, total: null, issue: null
    };
    if (widthCm === null || heightCm === null) return {...view, issue: 'missing-measures'};
    if (!Number.isInteger(line.quantity) || line.quantity < 1) return {...view, issue: 'invalid-quantity'};
    const sizes = {
      pieceSquareFeet: roundMoney(pieceSquareFeet(widthCm, heightCm)),
      squareFeet: roundMoney(lineSquareFeet(widthCm, heightCm, line.quantity))
    };
    if (price === null) return {...view, ...sizes, issue: 'no-price'};
    return {
      ...view, ...sizes,
      piecePrice: roundMoney(piecePrice(widthCm, heightCm, price)),
      total: lineTotal(widthCm, heightCm, line.quantity, price)
    };
  }
}

function emptyLine(glassTypeId: number): QuoteLineDraft {
  return {glassTypeId, width: null, height: null, unit: 'cm', quantity: 1};
}

function isPositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}
