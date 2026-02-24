'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import ProductCard from './ProductCard';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ProductGridProps {
  initialProducts?: Product[];
  showFilters?: boolean;
  showSearch?: boolean;
  featuredOnly?: boolean;
  categoryId?: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  initialProducts,
  showFilters = true,
  showSearch = true,
  featuredOnly = false,
  categoryId
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(categoryId || null);
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('name');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargamos productos y categorías. Si viene una categoría por prop, filtramos en cliente.
        const [productsData, categoriesData] = await Promise.all([
          featuredOnly ? productService.getFeaturedProducts() : productService.getProducts(),
          categoryService.getCategories()
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialProducts) {
      loadData();
    }
  }, [initialProducts, featuredOnly, categoryId]);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.description?.toLowerCase().includes(term) ?? false) ||
        product.sku.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name;
      if (selectedCategoryName) {
        // En el backend, los productos tienen el campo `category` (nombre), no `categoryId`
        filtered = filtered.filter(product => (product as any).category === selectedCategoryName);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, categories]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      {(showSearch || showFilters) && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            {showSearch && (
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Ordenar por Nombre</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="newest">Más Recientes</option>
              </select>

              {showFilters && (
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && showFiltersPanel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;