import {computed, inject, Injectable, signal} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {GlassType} from '../../catalog/domain/model/glass-type.entity';
import {glassTypeLabel} from '../../catalog/domain/model/glass-type.entity';
import {QuoteLine} from '../domain/model/quote-line.entity';
import {QuoteExtra} from '../domain/model/quote-extra.entity';
import {QuoteDetails, QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';
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

/** An additional concept with its computed total (null while incomplete). */
export interface QuoteExtraView {
  extra: QuoteExtra;
  total: number | null;
}

/** The saved quote currently loaded for editing. */
export interface EditingQuote {
  id: number;
  number: string;
  /** Total stored when it was saved, to warn about price changes. */
  savedTotal: number;
  /** Customer and payment details, to pre-fill the save dialog. */
  details: QuoteDetails;
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
  private readonly extrasSignal = signal<QuoteExtra[]>([]);
  private readonly selectedPriceListIdSignal = signal<number | null>(null);
  private readonly editingSignal = signal<EditingQuote | null>(null);

  readonly lines = this.linesSignal.asReadonly();
  readonly extras = this.extrasSignal.asReadonly();
  /** Saved quote being edited, or null for a new quote. */
  readonly editing = this.editingSignal.asReadonly();

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

  readonly extraViews = computed<QuoteExtraView[]>(() =>
    this.extrasSignal().map(extra => ({extra, total: extraTotal(extra)}))
  );

  /** IGV-included total of every priced glass line and complete extra concept. */
  readonly total = computed(() => roundMoney(
    this.lineViews().reduce((acc, v) => acc + (v.total ?? 0), 0) +
    this.extraViews().reduce((acc, v) => acc + (v.total ?? 0), 0)
  ));
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

  /** A quote can be saved when it has items and all of them are complete and priced. */
  readonly canSave = computed(() => {
    const lines = this.lineViews();
    const extras = this.extraViews();
    return lines.length + extras.length > 0
      && lines.every(v => v.issue === null)
      && extras.every(v => v.total !== null);
  });

  /** When editing, true if current catalog prices give a different total than the saved one. */
  readonly priceChanged = computed(() => {
    const editing = this.editingSignal();
    return !!editing && this.canSave() && this.total() !== editing.savedTotal;
  });

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

  /** Starts a new, empty quote (also leaves edit mode). */
  clear(): void {
    this.linesSignal.set([]);
    this.extrasSignal.set([]);
    this.editingSignal.set(null);
  }

  // ── additional concepts (price typed by the seller) ──

  addExtra(details: Partial<Omit<QuoteExtra, 'id'>> = {}): number {
    const id = this.nextId++;
    this.extrasSignal.update(list => [...list, {id, description: '', quantity: 1, unitPrice: null, ...details}]);
    return id;
  }

  updateExtra(id: number, changes: Partial<Omit<QuoteExtra, 'id'>>): void {
    this.extrasSignal.update(list => list.map(e => e.id === id ? {...e, ...changes} : e));
  }

  removeExtra(id: number): void {
    this.extrasSignal.update(list => list.filter(e => e.id !== id));
  }

  // ── saving ──

  /**
   * Freezes the quote for saving: every price, square foot and total as it is
   * now, so later price changes do not alter what the customer was told.
   * Returns null while the quote is incomplete.
   */
  toSnapshot(details: QuoteDetails): QuoteDraftSnapshot | null {
    const listId = this.priceListId();
    const list = this.catalog.priceLists().find(l => l.id === listId);
    if (!this.canSave() || !list) return null;
    const total = this.total();
    return {
      ...details,
      priceList: {id: list.id, name: list.name},
      currency: 'PEN',
      lines: this.lineViews().map(v => ({
        glassTypeId: v.line.glassTypeId,
        description: v.glass ? glassTypeLabel(v.glass) : '',
        width: v.line.width!, height: v.line.height!, unit: v.line.unit,
        billedWidthCm: v.roundedWidthCm!, billedHeightCm: v.roundedHeightCm!,
        quantity: v.line.quantity, squareFeet: v.squareFeet!, pricePerSqFt: v.pricePerSqFt!,
        unitPrice: v.piecePrice!, total: v.total!,
        ...(v.line.reference ? {reference: v.line.reference} : {}),
      })),
      extras: this.extraViews().map(v => ({
        description: v.extra.description.trim(), quantity: v.extra.quantity,
        unitPrice: v.extra.unitPrice!, total: v.total!,
      })),
      total,
      subtotal: subtotalWithoutIgv(total),
      igv: igvOf(total),
      advance: roundMoney(details.advance),
      balance: roundMoney(total - details.advance),
    };
  }

  /** Remembers that the current lines belong to a saved quote (after creating or updating it). */
  markSaved(saved: SavedQuote): void {
    const {customer, paymentMethod, advance, termsAccepted, notes} = saved;
    this.editingSignal.set({
      id: saved.id, number: saved.number, savedTotal: saved.total,
      details: {customer, paymentMethod, advance, termsAccepted, ...(notes ? {notes} : {})},
    });
  }

  /**
   * Loads a saved quote into the quoter to edit it. Lines are re-priced with
   * the current catalog; `priceChanged` tells whether the total moved.
   */
  loadForEditing(saved: SavedQuote): void {
    this.selectedPriceListIdSignal.set(saved.priceList.id);
    this.linesSignal.set(saved.lines.map(l => ({
      id: this.nextId++, glassTypeId: l.glassTypeId, width: l.width, height: l.height, unit: l.unit,
      quantity: l.quantity, ...(l.reference ? {reference: l.reference} : {}),
    })));
    this.extrasSignal.set(saved.extras.map(e => ({
      id: this.nextId++, description: e.description, quantity: e.quantity, unitPrice: e.unitPrice,
    })));
    this.markSaved(saved);
  }

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

/** Total of an additional concept, or null while description, quantity or price is missing. */
function extraTotal(extra: QuoteExtra): number | null {
  const valid = extra.description.trim() !== ''
    && Number.isInteger(extra.quantity) && extra.quantity >= 1
    && isPositive(extra.unitPrice);
  return valid ? roundMoney(extra.quantity * extra.unitPrice!) : null;
}

function isPositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}
