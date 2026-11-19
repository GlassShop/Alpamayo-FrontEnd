/**
 * Stock rules shared by the inventory screens and stores.
 *
 * @remarks
 * The status is worked out from the quantity instead of being typed, so it
 * can never say "En stock" when there are 0 units:
 * - never counted in the site → UNKNOWN ("Sin contar")
 * - 0 units → OUT ("Agotado")
 * - at or below the minimum → LOW ("Volver a comprar")
 * - otherwise → IN_STOCK
 * "En camino" is a separate flag marked by hand while an order travels.
 */

export type StockStatus = 'UNKNOWN' | 'OUT' | 'LOW' | 'IN_STOCK';

export function stockStatus(quantity: number | null | undefined, minStock: number | null): StockStatus {
  if (quantity === null || quantity === undefined) return 'UNKNOWN';
  if (quantity <= 0) return 'OUT';
  if (minStock !== null && quantity <= minStock) return 'LOW';
  return 'IN_STOCK';
}

/** Stock is counted in whole units: sheets, bars or pieces. */
export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/** A valid adjustment adds or removes whole units and never leaves the stock below zero. */
export function isValidAdjustment(current: number | null, delta: number): boolean {
  return Number.isInteger(delta) && delta !== 0 && (current ?? 0) + delta >= 0;
}

/** Units that come in from `packs` packs of `unitsPerPack`, e.g. 3 crates × 20 sheets = 60. */
export function unitsFromPacks(packs: number, unitsPerPack: number): number {
  if (!isValidQuantity(packs) || !Number.isInteger(unitsPerPack) || unitsPerPack < 1) {
    throw new RangeError(`packs and units per pack must be whole numbers, got ${packs} × ${unitsPerPack}`);
  }
  return packs * unitsPerPack;
}
