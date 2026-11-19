import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * Kinds of products sold besides glass (glass is sold by the square foot and
 * keeps its own price lists).
 */
export type ProductCategory = 'ALUMINUM_SERIES' | 'ALUMINUM_TRADITIONAL' | 'ACCESSORY' | 'OTHER';

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = ['ALUMINUM_SERIES', 'ALUMINUM_TRADITIONAL', 'ACCESSORY', 'OTHER'];

/** Wall thickness of a traditional aluminium profile. */
export type WeightClass = 'LIGHT' | 'SEMI_HEAVY' | 'HEAVY';

export const WEIGHT_CLASSES: readonly WeightClass[] = ['LIGHT', 'SEMI_HEAVY', 'HEAVY'];

/** What one unit of the public price is: a whole bar, a piece or a whole sheet. */
export type SaleUnit = 'BAR' | 'UNIT' | 'SHEET';

/** Aluminium is sold by the bar, accessories by the piece, acrylics and panels by the sheet. */
export const SALE_UNIT: Readonly<Record<ProductCategory, SaleUnit>> = {
  ALUMINUM_SERIES: 'BAR',
  ALUMINUM_TRADITIONAL: 'BAR',
  ACCESSORY: 'UNIT',
  OTHER: 'SHEET',
};

/**
 * A product of the sale catalog, e.g. "6001 Marco doble corredizo" of Serie 62.
 *
 * @remarks
 * It has ONE public price (IGV included) whatever its colour or exact size:
 * colours and sizes are inventory items of the product. Projects are quoted
 * with these public prices.
 */
export interface Product extends BaseEntity {
  category: ProductCategory;
  /** Supplier code, e.g. "6001"; empty when the product has none. */
  code: string;
  name: string;
  /** Only for ALUMINUM_SERIES. */
  seriesId: number | null;
  /** Mainly for accessories, e.g. "Parma"; empty when unknown. */
  brand: string;
  /** Only for ALUMINUM_TRADITIONAL. */
  weightClass: WeightClass | null;
  /** Price per bar, piece or sheet, IGV included; null until the CEO sets it. */
  publicPrice: number | null;
}

/** "6001 Marco doble corredizo" or "Bisagra 3" x 3" · Parma". */
export function productLabel(product: Pick<Product, 'code' | 'name' | 'brand'>): string {
  const base = product.code ? `${product.code} ${product.name}` : product.name;
  return product.brand ? `${base} · ${product.brand}` : base;
}
