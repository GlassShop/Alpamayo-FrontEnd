/**
 * Glass costing rule used by Vidriería Alpamayo.
 *
 * @remarks
 * The authoritative calculation lives on the server; this copy gives the
 * seller an instant preview and must follow exactly the same rule:
 * - Measures may come in cm, mm or inches; they are converted to cm first.
 * - Each measure is rounded UP to the next multiple of 5 cm.
 * - Line total = ((width × height / 900) × price per square foot) × quantity,
 *   i.e. square feet of one piece, times its price, times the quantity.
 * - IGV is included in the total: subtotal without IGV = total / 1.18.
 *
 * Values are rounded to 2 decimals only when displayed or summed as money,
 * never before multiplying (rounding early turns S/ 477.78 into S/ 477.76).
 */

import {CM_PER_UNIT, MeasureUnit} from '../model/measure-unit';

/** Square centimetres in one billing square foot (30 cm × 30 cm). */
export const CM2_PER_SQUARE_FOOT = 900;

/** Peruvian IGV rate, already included in every price. */
export const IGV_RATE = 0.18;

/**
 * Converts a measure to centimetres. The result is kept to 4 decimals so that
 * floating-point noise (e.g. 125.00000000000001) never pushes it to the next 5 cm.
 */
export function toCentimeters(value: number, unit: MeasureUnit): number {
  assertPositive(value, 'measure');
  return Math.round(value * CM_PER_UNIT[unit] * 10_000) / 10_000;
}

/** Rounds a measure in centimetres up to the next multiple of 5. */
export function roundUpToFive(cm: number): number {
  assertPositive(cm, 'measure');
  return Math.ceil(cm / 5) * 5;
}

/** Square feet of a single piece after rounding both measures. */
export function pieceSquareFeet(widthCm: number, heightCm: number): number {
  return (roundUpToFive(widthCm) * roundUpToFive(heightCm)) / CM2_PER_SQUARE_FOOT;
}

/** Square feet of a whole line (piece × quantity). Not rounded. */
export function lineSquareFeet(widthCm: number, heightCm: number, quantity: number): number {
  assertQuantity(quantity);
  return pieceSquareFeet(widthCm, heightCm) * quantity;
}

/** Price of one piece: (width × height / 900) × price per square foot. Not rounded. */
export function piecePrice(widthCm: number, heightCm: number, pricePerSqFt: number): number {
  assertPositive(pricePerSqFt, 'price per square foot');
  return pieceSquareFeet(widthCm, heightCm) * pricePerSqFt;
}

/** Money total of a line: ((width × height / 900) × price) × quantity, rounded to cents. */
export function lineTotal(widthCm: number, heightCm: number, quantity: number, pricePerSqFt: number): number {
  assertQuantity(quantity);
  return roundMoney(piecePrice(widthCm, heightCm, pricePerSqFt) * quantity);
}

/** Amount without IGV contained in an IGV-included total. */
export function subtotalWithoutIgv(total: number): number {
  return roundMoney(total / (1 + IGV_RATE));
}

/** IGV portion contained in an IGV-included total. */
export function igvOf(total: number): number {
  return roundMoney(total - subtotalWithoutIgv(total));
}

/** Rounds to 2 decimals (half up), for money and displayed square feet. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError(`quantity must be a positive integer, got ${quantity}`);
  }
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive number, got ${value}`);
  }
}
