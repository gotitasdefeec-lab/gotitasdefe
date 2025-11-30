import api from './api';
import publicApi from './api';
import type { Product } from '../types/product';
import type { Category } from '../types/category';

export const productService = {
  // Get all products (public endpoint)
  async getProducts(): Promise<Product[]> {
    try {
      const response = await publicApi.get('/public/products');
      let products = [];
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      } else {
        return [];
      }
      return products;
    } catch (error: any) {
      return [];
    }
  },

  // Get product by ID
  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await publicApi.get(`/public/products/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await publicApi.get('/public/products/featured');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(categoryName: string): Promise<Product[]> {
    try {
      const response = await publicApi.get(`/public/categories/${categoryName}/products`);
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    } catch (error) {
      return [];
    }
  },

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      const lowerQuery = query.toLowerCase();
      return products.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        (product.sku?.toLowerCase() || '').includes(lowerQuery)
      );
    } catch (error) {
      return [];
    }
  }
};

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await publicApi.get('/public/categories');
      let categories = [];
      if (Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else {
        return [];
      }
      return categories;
    } catch (error: any) {
      return [];
    }
  }
};
