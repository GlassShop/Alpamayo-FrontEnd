import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** How the supplier delivers an item: glass in crates (jabas), aluminium in bundles, accessories in boxes. */
export type PackKind = 'CRATE' | 'BUNDLE' | 'BOX';

export const PACK_KINDS: readonly PackKind[] = ['CRATE', 'BUNDLE', 'BOX'];

/**
 * One exact thing kept in stock: a product (or glass type) in one colour and,
 * for sheets, one size — e.g. "6001 Marco doble corredizo · Negro" or
 * "Laminado 6 mm incoloro · 330 × 214 cm".
 *
 * @remarks
 * Exactly one of `glassTypeId` / `productId` is set. Stock is counted in
 * units (sheets, bars, pieces); the pack is used only when goods come in.
 */
export interface InventoryItem extends BaseEntity {
  glassTypeId: number | null;
  productId: number | null;
  /** Empty for glass, whose colour is part of the glass type. */
  color: string;
  /** Internal code; empty when there is none. */
  sku: string;
  /** Sheet size, for glass and other sheets. */
  widthCm: number | null;
  heightCm: number | null;
  packKind: PackKind | null;
  /** Units in one pack, e.g. 20 sheets per crate. */
  unitsPerPack: number | null;
  /** At or below this quantity the item must be bought again; null when not set. */
  minStock: number | null;
}

/** "330 × 214 cm", or empty when the item has no size. */
export function itemSize(item: Pick<InventoryItem, 'widthCm' | 'heightCm'>): string {
  return item.widthCm && item.heightCm ? `${item.widthCm} × ${item.heightCm} cm` : '';
}
