export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  stock: number;
  featured?: boolean;
  categoryId?: number;
  tags?: string[];
  createdAt?: string;
}
