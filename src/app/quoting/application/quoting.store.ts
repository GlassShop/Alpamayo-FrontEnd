import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {CatalogStore} from '../../catalog/application/catalog.store';
import {ProductsStore} from '../../catalog/application/products.store';
import {SaleSettingsStore} from '../../catalog/application/sale-settings.store';
import {GlassType, glassTypeLabel} from '../../catalog/domain/model/glass-type.entity';
import {Product, productLabel, SALE_UNIT, SaleUnit} from '../../catalog/domain/model/product.entity';
import {IamStore} from '../../iam/application/iam.store';
import {QuoteLine} from '../domain/model/quote-line.entity';
import {QuoteExtra} from '../domain/model/quote-extra.entity';
import {QuoteProductLine} from '../domain/model/quote-product.entity';
import {QuoteDetails, QuoteDraftSnapshot, SavedQuote} from '../domain/model/saved-quote.entity';
import {
  igvOf, lineSquareFeet, lineTotal, piecePrice, pieceSquareFeet, roundMoney, roundUpToFive, subtotalWithoutIgv,
  toCentimeters
} from '../domain/services/square-foot-calculator';
import {discountPercent, isAllowedPrice, minAllowedPrice} from '../domain/services/price-adjustment';

/** Why a glass line cannot be saved yet. */
export type LineIssue = 'missing-measures' | 'invalid-quantity' | 'no-price' | 'below-limit';

/** Why a product line cannot be saved yet. */
export type ProductIssue = 'unknown-product' | 'invalid-quantity' | 'no-price' | 'below-limit';

/** A line as entered, before it gets an id. */
export type QuoteLineDraft = Omit<QuoteLine, 'id'>;

/** The final price of a line compared with the catalog. */
interface PriceView {
  /** True when the seller typed a final price different from the catalog one. */
  adjusted: boolean;
  /** Discount against the catalog in % (negative when raised); null without catalog price. */
  discountPercent: number | null;
  /** Lowest price the user may type; null when the user has no limit or there is no catalog price. */
  minPrice: number | null;
}

/** A quote line enriched with everything the view needs to display. */
export interface QuoteLineView extends PriceView {
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
  catalogPricePerSqFt: number | null;
  /** Price per square foot charged: the catalog one or the final price typed by the seller. */
  pricePerSqFt: number | null;
  total: number | null;
  issue: LineIssue | null;
}

/** A product line with its prices and total. */
export interface QuoteProductView extends PriceView {
  line: QuoteProductLine;
  product: Product | undefined;
  /** "6001 Marco doble corredizo", or empty when the product is unknown. */
  label: string;
  saleUnit: SaleUnit | null;
  /** Public price of the catalog. */
  catalogPrice: number | null;
  /** Unit price charged: the public one or the final price typed by the seller. */
  unitPrice: number | null;
  total: number | null;
  issue: ProductIssue | null;
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

/** What is kept in the browser session so the quote survives moving between pages or reloading. */
interface QuoteDraft {
  lines: QuoteLine[];
  products: QuoteProductLine[];
  extras: QuoteExtra[];
  priceListId: number | null;
  editing: EditingQuote | null;
  nextId: number;
}

const DRAFT_KEY = 'alpamayo.quote-draft';

/**
 * State of the quote being built by the seller: glass lines, catalog products
 * and additional concepts, saved together.
 *
 * @remarks
 * Catalog prices are read from {@link CatalogStore} (glass, for the selected
 * price list) and {@link ProductsStore} (products, always the public price).
 * The seller may type a final price per line: raising it is free, lowering it
 * is allowed down to the CEO's maximum discount; the CEO has no limit.
 * Totals update instantly. The draft is kept in the browser session of the
 * signed-in user, so products can be added from the catalog and the quote
 * finished later.
 */
@Injectable({providedIn: 'root'})
export class QuotingStore {
  private readonly catalog = inject(CatalogStore);
  private readonly productsStore = inject(ProductsStore);
  private readonly saleSettings = inject(SaleSettingsStore);
  private readonly iam = inject(IamStore);
  private nextId = 1;
  private ownerId: number | null = null;

  private readonly linesSignal = signal<QuoteLine[]>([]);
  private readonly productsSignal = signal<QuoteProductLine[]>([]);
  private readonly extrasSignal = signal<QuoteExtra[]>([]);
  private readonly selectedPriceListIdSignal = signal<number | null>(null);
  private readonly editingSignal = signal<EditingQuote | null>(null);

  readonly lines = this.linesSignal.asReadonly();
  readonly products = this.productsSignal.asReadonly();
  readonly extras = this.extrasSignal.asReadonly();
  /** Saved quote being edited, or null for a new quote. */
  readonly editing = this.editingSignal.asReadonly();

  /** Whoever manages prices (the CEO) may set any final price. */
  readonly unlimitedDiscount = computed(() => this.iam.can('prices.manage'));
  /** Most a seller may lower a price, in %; 0 while the CEO has not set it. */
  readonly maxDiscountPercent = computed(() => this.saleSettings.maxDiscountPercent() ?? 0);

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

  readonly productViews = computed<QuoteProductView[]>(() =>
    this.productsSignal().map(line => this.toProductView(line))
  );

  readonly extraViews = computed<QuoteExtraView[]>(() =>
    this.extrasSignal().map(extra => ({extra, total: extraTotal(extra)}))
  );

  /** IGV-included total of every priced line: glass, products and complete extra concepts. */
  readonly total = computed(() => roundMoney(
    this.lineViews().reduce((acc, v) => acc + (v.total ?? 0), 0) +
    this.productViews().reduce((acc, v) => acc + (v.total ?? 0), 0) +
    this.extraViews().reduce((acc, v) => acc + (v.total ?? 0), 0)
  ));
  readonly subtotal = computed(() => subtotalWithoutIgv(this.total()));
  readonly igv      = computed(() => igvOf(this.total()));
  /** Rows on the quote (glass, products and extra concepts), shown on the catalog's quote bar. */
  readonly rowCount = computed(() => this.linesSignal().length + this.productsSignal().length + this.extrasSignal().length);
  /** Number of glass pieces in the quote (sum of quantities of complete lines). */
  readonly pieces = computed(() =>
    this.lineViews().reduce((acc, v) => acc + (v.squareFeet !== null ? v.line.quantity : 0), 0)
  );
  readonly totalSquareFeet = computed(() =>
    roundMoney(this.lineViews().reduce((acc, v) => acc + (v.squareFeet ?? 0), 0))
  );
  /** True when every glass line is complete and priced. */
  readonly isComplete = computed(() =>
    this.lineViews().length > 0 && this.lineViews().every(v => v.issue === null)
  );

  /** A quote can be saved when it has items and all of them are complete, priced and within the discount limit. */
  readonly canSave = computed(() => this.rowCount() > 0
    && this.lineViews().every(v => v.issue === null)
    && this.productViews().every(v => v.issue === null)
    && this.extraViews().every(v => v.total !== null));

  /** When editing, true if current catalog prices give a different total than the saved one. */
  readonly priceChanged = computed(() => {
    const editing = this.editingSignal();
    return !!editing && this.canSave() && this.total() !== editing.savedTotal;
  });

  constructor() {
    this.switchOwner(this.iam.currentUser()?.id ?? null);
    // Another user signing in on the same tab gets their own draft, never the previous one's.
    effect(() => {
      const userId = this.iam.currentUser()?.id ?? null;
      untracked(() => this.switchOwner(userId));
    });
  }

  selectPriceList(priceListId: number): void {
    this.selectedPriceListIdSignal.set(priceListId);
    this.persist();
  }

  // ── glass lines ──

  /** Adds a line, optionally with its measures, and returns its id. */
  addLine(glassTypeId: number, details: Partial<Omit<QuoteLineDraft, 'glassTypeId'>> = {}): number {
    const id = this.nextId++;
    this.linesSignal.update(lines => [...lines, {...emptyLine(glassTypeId), ...details, id}]);
    this.persist();
    return id;
  }

  updateLine(id: number, changes: Partial<QuoteLineDraft>): void {
    this.linesSignal.update(lines => lines.map(l => l.id === id ? {...l, ...changes} : l));
    this.persist();
  }

  removeLine(id: number): void {
    this.linesSignal.update(lines => lines.filter(l => l.id !== id));
    this.persist();
  }

  /** Replaces every glass line of the quote, e.g. with the rows imported from Excel. */
  replaceLines(drafts: QuoteLineDraft[]): void {
    this.linesSignal.set(drafts.map(d => ({...d, id: this.nextId++})));
    this.persist();
  }

  // ── catalog products (public price) ──

  /**
   * Adds whole units of a product in a colour. The same product in the same
   * colour adds up on its existing row. Returns the row id, or null when the
   * quantity is not a whole number of at least 1.
   */
  addProduct(productId: number, color: string, quantity: number): number | null {
    if (!Number.isInteger(quantity) || quantity < 1) return null;
    const cleanColor = color.trim();
    const same = this.productsSignal().find(p => p.productId === productId && sameText(p.color, cleanColor));
    if (same) {
      this.updateProduct(same.id, {quantity: same.quantity + quantity});
      return same.id;
    }
    const id = this.nextId++;
    this.productsSignal.update(list => [...list, {id, productId, color: cleanColor, quantity, adjustedPrice: null}]);
    this.persist();
    return id;
  }

  updateProduct(id: number, changes: Partial<Pick<QuoteProductLine, 'quantity' | 'adjustedPrice'>>): void {
    this.productsSignal.update(list => list.map(p => p.id === id ? {...p, ...changes} : p));
    this.persist();
  }

  removeProduct(id: number): void {
    this.productsSignal.update(list => list.filter(p => p.id !== id));
    this.persist();
  }

  // ── additional concepts (price typed by the seller) ──

  addExtra(details: Partial<Omit<QuoteExtra, 'id'>> = {}): number {
    const id = this.nextId++;
    this.extrasSignal.update(list => [...list, {id, description: '', quantity: 1, unitPrice: null, ...details}]);
    this.persist();
    return id;
  }

  updateExtra(id: number, changes: Partial<Omit<QuoteExtra, 'id'>>): void {
    this.extrasSignal.update(list => list.map(e => e.id === id ? {...e, ...changes} : e));
    this.persist();
  }

  removeExtra(id: number): void {
    this.extrasSignal.update(list => list.filter(e => e.id !== id));
    this.persist();
  }

  /** Starts a new, empty quote (also leaves edit mode). */
  clear(): void {
    this.linesSignal.set([]);
    this.productsSignal.set([]);
    this.extrasSignal.set([]);
    this.editingSignal.set(null);
    this.persist();
  }

  // ── saving ──

  /**
   * Freezes the quote for saving: every catalog price, final price, square
   * foot and total as it is now, so later price changes do not alter what
   * the customer was told. Returns null while the quote cannot be saved.
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
        quantity: v.line.quantity, squareFeet: v.squareFeet!,
        pricePerSqFt: v.pricePerSqFt!, catalogPricePerSqFt: v.catalogPricePerSqFt!,
        unitPrice: v.piecePrice!, total: v.total!,
        ...(v.line.reference ? {reference: v.line.reference} : {}),
      })),
      products: this.productViews().map(v => ({
        productId: v.line.productId, description: v.label, color: v.line.color, saleUnit: v.saleUnit!,
        quantity: v.line.quantity, catalogUnitPrice: v.catalogPrice!, unitPrice: v.unitPrice!, total: v.total!,
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
    this.persist();
  }

  /**
   * Loads a saved quote into the quoter to edit it. Lines are re-priced with
   * the current catalog, keeping the final prices the seller typed;
   * `priceChanged` tells whether the total moved.
   */
  loadForEditing(saved: SavedQuote): void {
    this.selectedPriceListIdSignal.set(saved.priceList.id);
    this.linesSignal.set(saved.lines.map(l => ({
      id: this.nextId++, glassTypeId: l.glassTypeId, width: l.width, height: l.height, unit: l.unit,
      quantity: l.quantity, ...(l.reference ? {reference: l.reference} : {}),
      adjustedPrice: l.catalogPricePerSqFt !== undefined && l.pricePerSqFt !== l.catalogPricePerSqFt ? l.pricePerSqFt : null,
    })));
    this.productsSignal.set((saved.products ?? []).map(p => ({
      id: this.nextId++, productId: p.productId, color: p.color, quantity: p.quantity,
      adjustedPrice: p.unitPrice !== p.catalogUnitPrice ? p.unitPrice : null,
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

  // ── pricing ──

  private priceView(catalogPrice: number | null, adjustedPrice: number | null | undefined): PriceView & {price: number | null; allowed: boolean} {
    if (catalogPrice === null) return {price: null, allowed: true, adjusted: false, discountPercent: null, minPrice: null};
    const adjusted = adjustedPrice != null && adjustedPrice !== catalogPrice;
    const price = adjusted ? adjustedPrice! : catalogPrice;
    const unlimited = this.unlimitedDiscount();
    const max = this.maxDiscountPercent();
    return {
      price, adjusted,
      allowed: !adjusted || isAllowedPrice(catalogPrice, price, max, unlimited),
      discountPercent: adjusted ? discountPercent(catalogPrice, price) : 0,
      minPrice: unlimited ? null : minAllowedPrice(catalogPrice, max),
    };
  }

  private toView(line: QuoteLine, glass: GlassType | undefined, listId: number | null): QuoteLineView {
    const catalogPrice = listId === null ? null : this.catalog.priceFor(line.glassTypeId, listId);
    const {price, allowed, ...priceInfo} = this.priceView(catalogPrice, line.adjustedPrice);
    const widthCm  = isPositive(line.width)  ? toCentimeters(line.width,  line.unit) : null;
    const heightCm = isPositive(line.height) ? toCentimeters(line.height, line.unit) : null;
    const view: QuoteLineView = {
      line, glass, catalogPricePerSqFt: catalogPrice, pricePerSqFt: price, ...priceInfo, widthCm, heightCm,
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
      total: lineTotal(widthCm, heightCm, line.quantity, price),
      issue: allowed ? null : 'below-limit'
    };
  }

  private toProductView(line: QuoteProductLine): QuoteProductView {
    const product = this.productsStore.product(line.productId);
    const catalogPrice = product?.publicPrice ?? null;
    const {price, allowed, ...priceInfo} = this.priceView(catalogPrice, line.adjustedPrice);
    const view: QuoteProductView = {
      line, product, label: product ? productLabel(product) : '', saleUnit: product ? SALE_UNIT[product.category] : null,
      catalogPrice, unitPrice: price, ...priceInfo, total: null, issue: null,
    };
    if (!product) return {...view, issue: 'unknown-product'};
    if (!Number.isInteger(line.quantity) || line.quantity < 1) return {...view, issue: 'invalid-quantity'};
    if (price === null) return {...view, issue: 'no-price'};
    return {...view, total: roundMoney(price * line.quantity), issue: allowed ? null : 'below-limit'};
  }

  // ── draft kept in the browser session ──

  private switchOwner(userId: number | null): void {
    if (userId === this.ownerId && userId !== null) return;
    this.ownerId = userId;
    const draft = userId === null ? null : readDraft(draftKey(userId));
    this.linesSignal.set(draft?.lines ?? []);
    this.productsSignal.set(draft?.products ?? []);
    this.extrasSignal.set(draft?.extras ?? []);
    this.selectedPriceListIdSignal.set(draft?.priceListId ?? null);
    this.editingSignal.set(draft?.editing ?? null);
    this.nextId = Math.max(this.nextId, draft?.nextId ?? 1);
  }

  private persist(): void {
    if (this.ownerId === null) return;
    const key = draftKey(this.ownerId);
    try {
      if (this.rowCount() === 0 && !this.editingSignal()) {
        globalThis.sessionStorage?.removeItem(key);
        return;
      }
      const draft: QuoteDraft = {
        lines: this.linesSignal(), products: this.productsSignal(), extras: this.extrasSignal(),
        priceListId: this.selectedPriceListIdSignal(), editing: this.editingSignal(), nextId: this.nextId,
      };
      globalThis.sessionStorage?.setItem(key, JSON.stringify(draft));
    } catch { /* storage unavailable or full: the quote stays in memory only */ }
  }
}

function draftKey(userId: number): string {
  return `${DRAFT_KEY}.${userId}`;
}

/** Reads a stored draft; anything unreadable counts as no draft. */
function readDraft(key: string): QuoteDraft | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<QuoteDraft>;
    if (!Array.isArray(draft.lines) || !Array.isArray(draft.products) || !Array.isArray(draft.extras)) return null;
    return {
      lines: draft.lines, products: draft.products, extras: draft.extras,
      priceListId: typeof draft.priceListId === 'number' ? draft.priceListId : null,
      editing: draft.editing ?? null,
      nextId: typeof draft.nextId === 'number' ? draft.nextId : 1,
    };
  } catch {
    return null;
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

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
