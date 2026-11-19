/**
 * Landed cost of a purchase: what each unit really costs once it is in the
 * site, in soles, IGV included like every price of the shop.
 *
 * @remarks
 * Rule agreed with Dylan:
 * - Each line is priced in US dollars per unit and converted with the
 *   exchange rate of the purchase.
 * - Freight and the Lima → Huaraz transport are paid per shipment (in soles
 *   or dollars) and shared among the lines **by value**: a crate of laminated
 *   glass carries more freight than a box of screws.
 * - Unit cost = (line value + its freight + its transport) / units.
 * The server stores the authoritative result; this copy gives the CEO a
 * preview while typing. Nothing is rounded until it is stored or shown.
 */

export type Currency = 'PEN' | 'USD';

export const CURRENCIES: readonly Currency[] = ['PEN', 'USD'];

export interface Money {
  amount: number;
  currency: Currency;
}

export interface CostLineInput {
  /** Units received (sheets, bars, pieces). */
  quantity: number;
  /** Price of one unit in US dollars. */
  unitPriceUsd: number;
}

export interface CostLineResult {
  /** Line value in soles: units × price × exchange rate. */
  valuePen: number;
  /** Part of the purchase value, from 0 to 1. */
  share: number;
  freightPen: number;
  transportPen: number;
  /** Everything the line cost in soles. */
  totalCost: number;
  /** Landed cost of one unit in soles. */
  unitCost: number;
}

/** Converts an amount to soles with the exchange rate of the purchase. */
export function toSoles(money: Money, exchangeRate: number): number {
  assertPositive(exchangeRate, 'exchange rate');
  if (!Number.isFinite(money.amount) || money.amount < 0) {
    throw new RangeError(`amount must be zero or more, got ${money.amount}`);
  }
  return money.currency === 'USD' ? money.amount * exchangeRate : money.amount;
}

/** Landed cost of every line, sharing freight and transport by the value of each line. */
export function landedCosts(lines: readonly CostLineInput[], exchangeRate: number, freight: Money, transport: Money): CostLineResult[] {
  assertPositive(exchangeRate, 'exchange rate');
  lines.forEach(line => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new RangeError(`quantity must be a whole number above zero, got ${line.quantity}`);
    assertPositive(line.unitPriceUsd, 'unit price');
  });
  const freightPen = toSoles(freight, exchangeRate);
  const transportPen = toSoles(transport, exchangeRate);
  const values = lines.map(line => line.quantity * line.unitPriceUsd * exchangeRate);
  const totalValue = values.reduce((sum, v) => sum + v, 0);
  return lines.map((line, i) => {
    const share = totalValue > 0 ? values[i] / totalValue : 0;
    const lineFreight = freightPen * share;
    const lineTransport = transportPen * share;
    const totalCost = values[i] + lineFreight + lineTransport;
    return {valuePen: values[i], share, freightPen: lineFreight, transportPen: lineTransport, totalCost, unitCost: totalCost / line.quantity};
  });
}

/** Rounds a stored unit cost to 4 decimals: screws and wall plugs cost less than a cent per unit. */
export function roundUnitCost(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive number, got ${value}`);
}
