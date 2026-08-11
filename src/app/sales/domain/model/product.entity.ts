export type ProductCategory = 'glass' | 'profiles' | 'accessories';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  stockUnit: string;
  imageUrl?: string;
}

