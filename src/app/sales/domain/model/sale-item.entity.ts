import {Product} from './product.entity';

export interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

