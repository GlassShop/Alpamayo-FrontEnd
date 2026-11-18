/** How the customer will pay. */
export type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'CARD';

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['CASH', 'YAPE', 'PLIN', 'CARD'];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Only soles for now; the type is ready for other currencies. */
export type Currency = 'PEN';
