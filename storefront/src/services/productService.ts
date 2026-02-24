import api, { publicApi } from './api';
import { Product, Category } from '@/types';

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
        console.warn('Unexpected API response format:', response.data);
        return [];
      }

      console.log(`Successfully fetched ${products.length} products`);

      // Asegurar que todos los productos tienen las propiedades necesarias
      const processedProducts = products.map((product: any) => ({
        ...product,
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0,
        featured: Boolean(product.featured),
        categoryId: product.categoryId || null,
        tags: Array.isArray(product.tags) ? product.tags : [],
        createdAt: product.createdAt || new Date().toISOString()
      }));

      return processedProducts;
    } catch (error: any) {
      // console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get product by ID
  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await publicApi.get(`/public/products/${id}`, {
        timeout: 5000, // 5 second timeout
      });
      return response.data;
    } catch (error) {
      // console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const response = await publicApi.get('/public/products/featured');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    } catch (error) {
      // console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(categoryName: string): Promise<Product[]> {
    try {
      const response = await publicApi.get(`/public/categories/${categoryName}/products`);
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    } catch (error) {
      // console.error('Error fetching products by category:', error);
      return [];
    }
  },

  // Search products for autocomplete (returns limited results with images)
  async searchProductsAutocomplete(query: string, limit: number = 6): Promise<Product[]> {
    try {
      if (!query.trim()) return [];

      const allProducts = await this.getProducts();
      const lowerQuery = query.toLowerCase();

      const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery)
      );

      // Return only the first 'limit' products for autocomplete
      return filteredProducts.slice(0, limit);
    } catch (error) {
      // console.error('Error searching products for autocomplete:', error);
      return [];
    }
  },

  // Search products (existing function)
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      const lowerQuery = query.toLowerCase();
      return products.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      // console.error('Error searching products:', error);
      return [];
    }
  }
};