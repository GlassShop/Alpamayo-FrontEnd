import {Customer} from './customer.entity';
import {SaleItem} from './sale-item.entity';

export type QuoteType = 'cotizacion' | 'factura' | 'boleta';

export interface Quote {
  id: string;
  number: string;
  date: Date;
  type: QuoteType;
  customer: Customer;
  items: SaleItem[];
  sellerName: string;
  currency: string;
  paymentMethod: string;
  partialPayment: number;
  subtotal: number;
  taxes: number;
  total: number;
}

