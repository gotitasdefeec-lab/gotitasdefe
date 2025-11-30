'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import ProductCard from './ProductCard';
import { 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MobileProductGridProps {
  searchQuery?: string;
}

const MobileProductGrid: React.FC<MobileProductGridProps> = ({ searchQuery }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy, filterCategory, priceRange]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Error al cargar productos');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => product.active);

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.name?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category?.name === filterCategory);
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))] as string[];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadProducts}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header with Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Productos ({filteredProducts.length})
          </h2>
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {viewMode === 'grid' ? (
                <ListBulletIcon className="h-5 w-5 text-gray-700" />
              ) : (
                <Squares2X2Icon className="h-5 w-5 text-gray-700" />
              )}
            </button>
            
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 text-blue-700" />
            </button>
          </div>
        </div>

        {/* Quick Sort */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Ordenar:</span>
          {[
            { value: 'name', label: 'Nombre' },
            { value: 'price_asc', label: 'Precio ↑' },
            { value: 'price_desc', label: 'Precio ↓' },
            { value: 'newest', label: 'Nuevos' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                sortBy === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">Filtros</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de precio: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-full accent-blue-600"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilterCategory('all');
              setPriceRange([0, 1000]);
            }}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Resultados para: <strong>"{searchQuery}"</strong>
            </span>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda'
              : 'Ajusta los filtros para ver más productos'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 gap-3 sm:gap-4'
            : 'space-y-3'
        }>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className={viewMode === 'list' ? 'flex flex-row h-24' : ''}
            />
          ))}
        </div>
      )}

      {/* Load More Button for Future Pagination */}
      {filteredProducts.length > 0 && (
        <div className="text-center py-4">
          <button className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Ver más productos
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileProductGrid;