'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export interface AdvancedFilters {
  searchTerm: string;
  categoryId: number | null;
  priceRange: [number, number];
  inStock: boolean | null;
  featured: boolean | null;
  sortBy: 'name' | 'price-low' | 'price-high' | 'newest' | 'popular';
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: AdvancedFilters, products: Product[]) => void;
  initialFilters?: Partial<AdvancedFilters>;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onFiltersChange,
  initialFilters = {}
}) => {
  console.log('AdvancedSearch: Componente inicializado', { initialFilters });

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    categoryId: null,
    priceRange: [0, 1000],
    inStock: null,
    featured: null,
    sortBy: 'name',
    ...initialFilters
  });

  // Rango de precios dinámico
  const [priceStats, setPriceStats] = useState({ min: 0, max: 1000 });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('AdvancedSearch: Iniciando carga de datos...');

        const [productsData, categoriesData] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories()
        ]);

        console.log('AdvancedSearch: Datos cargados', {
          products: productsData.length,
          categories: categoriesData.length
        });

        setAllProducts(productsData);
        setCategories(categoriesData);

        // Calcular estadísticas de precios
        let minPrice = 0;
        let maxPrice = 1000;

        if (productsData.length > 0) {
          const validPrices = productsData
            .map(p => parseFloat(p.price.toString()) || 0)
            .filter(price => price > 0);

          if (validPrices.length > 0) {
            minPrice = Math.min(...validPrices);
            maxPrice = Math.max(...validPrices);
            setPriceStats({ min: minPrice, max: maxPrice });

            // Actualizar filtros si es la primera carga
            if (filters.priceRange[1] === 1000) {
              setFilters(prev => ({
                ...prev,
                priceRange: [minPrice, maxPrice]
              }));
            }
          }
        }

        // Cargar historial de búsqueda
        try {
          const savedHistory = localStorage.getItem('searchHistory');
          if (savedHistory) {
            const history = JSON.parse(savedHistory);
            if (Array.isArray(history)) {
              setSearchHistory(history.slice(0, 5));
            }
          }
        } catch (historyError) {
          console.warn('Error loading search history:', historyError);
        }

        // Llamar onFiltersChange inmediatamente con los datos iniciales
        console.log('AdvancedSearch: Llamando onFiltersChange inicial con', {
          products: productsData.length,
          initialFilters
        });

        const initialFiltersWithDefaults = {
          searchTerm: '',
          categoryId: null,
          priceRange: [minPrice, maxPrice] as [number, number],
          inStock: null,
          featured: null,
          sortBy: 'name' as const,
          ...initialFilters
        };

        onFiltersChange(initialFiltersWithDefaults, productsData);
      } catch (error) {
        console.error('AdvancedSearch: Error loading data:', error);
        // Llamar onFiltersChange con datos vacíos en caso de error
        onFiltersChange({
          searchTerm: '',
          categoryId: null,
          priceRange: [0, 1000],
          inStock: null,
          featured: null,
          sortBy: 'name'
        }, []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    if (allProducts.length === 0) return;

    let filtered = [...allProducts];
    const hasSearchTerm = filters.searchTerm.trim().length > 0;

    // Búsqueda por texto (mejorada)
    if (hasSearchTerm) {
      const searchTerms = filters.searchTerm.toLowerCase().split(' ').filter(Boolean);

      filtered = filtered.filter(product => {
        const searchableText = [
          product.name || '',
          product.description || '',
          product.sku || '',
          ...(product.tags || [])
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Filtro por categoría
    if (filters.categoryId) {
      filtered = filtered.filter(product => product.categoryId === filters.categoryId);
    }

    // Filtro por rango de precios
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price.toString()) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filtro por disponibilidad
    if (filters.inStock !== null) {
      filtered = filtered.filter(product => {
        const stock = parseInt(product.stock.toString()) || 0;
        return filters.inStock ? stock > 0 : stock === 0;
      });
    }

    // Filtro por productos destacados
    if (filters.featured !== null) {
      filtered = filtered.filter(product => Boolean(product.featured) === filters.featured);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return (parseFloat(a.price.toString()) || 0) - (parseFloat(b.price.toString()) || 0);
        case 'price-high':
          return (parseFloat(b.price.toString()) || 0) - (parseFloat(a.price.toString()) || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'popular':
          // Mock: ordenar por productos destacados primero, luego por stock
          const aFeatured = Boolean(a.featured);
          const bFeatured = Boolean(b.featured);
          if (aFeatured && !bFeatured) return -1;
          if (!aFeatured && bFeatured) return 1;
          return (parseInt(b.stock.toString()) || 0) - (parseInt(a.stock.toString()) || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    // Solo log cuando hay búsqueda activa
    if (hasSearchTerm || filters.categoryId || filters.inStock !== null || filters.featured !== null) {
      console.log('AdvancedSearch: Filtrado completado', {
        searchTerm: filters.searchTerm,
        totalProducts: allProducts.length,
        filteredProducts: filtered.length,
        filters: {
          category: filters.categoryId,
          inStock: filters.inStock,
          featured: filters.featured,
          priceRange: filters.priceRange
        }
      });
    }

    console.log('AdvancedSearch: Enviando filtros a padre', {
      filters,
      filteredProductsCount: filtered.length
    });

    onFiltersChange(filters, filtered);
  }, [filters, allProducts, onFiltersChange]);

  const handleSearchSubmit = (searchTerm: string) => {
    if (searchTerm.trim()) {
      // Guardar en historial
      const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      setShowHistory(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      categoryId: null,
      priceRange: [priceStats.min, priceStats.max],
      inStock: null,
      featured: null,
      sortBy: 'name'
    });
  };

  const hasActiveFilters = () => {
    return filters.searchTerm ||
      filters.categoryId ||
      filters.priceRange[0] !== priceStats.min ||
      filters.priceRange[1] !== priceStats.max ||
      filters.inStock !== null ||
      filters.featured !== null;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-md bg-gray-200 h-10 flex-1"></div>
          <div className="rounded-md bg-gray-200 h-10 w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Barra de búsqueda principal */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Campo de búsqueda */}
          <div className="flex-1 relative">
            <div className="relative">
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(filters.searchTerm)}
                onFocus={() => setShowHistory(searchHistory.length > 0)}
                placeholder="Buscar productos por nombre, descripción, SKU..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

              {/* Historial de búsqueda */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Búsquedas recientes
                    </div>
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, searchTerm: term }));
                          setShowHistory(false);
                          handleSearchSubmit(term);
                        }}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles de ordenamiento y filtros */}
          <div className="flex items-center space-x-3">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="newest">Más Recientes</option>
              <option value="popular">Más Populares</option>
            </select>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center space-x-2 px-4 py-3 border rounded-lg transition-colors text-sm ${showAdvanced || hasActiveFilters()
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
                }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filtros Avanzados</span>
              {hasActiveFilters() && (
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  categoryId: e.target.value ? Number(e.target.value) : null
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por rango de precios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Precios
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [Number(e.target.value), prev.priceRange[1]]
                    }))}
                    placeholder="Mín"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min={priceStats.min}
                    max={priceStats.max}
                  />
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], Number(e.target.value)]
                    }))}
                    placeholder="Máx"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min={priceStats.min}
                    max={priceStats.max}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  ${priceStats.min} - ${priceStats.max}
                </div>
              </div>
            </div>

            {/* Filtro por disponibilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilidad
              </label>
              <select
                value={filters.inStock === null ? '' : filters.inStock.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  inStock: e.target.value === '' ? null : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos</option>
                <option value="true">En Stock</option>
                <option value="false">Agotado</option>
              </select>
            </div>

            {/* Filtro por productos destacados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Producto
              </label>
              <select
                value={filters.featured === null ? '' : filters.featured.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  featured: e.target.value === '' ? null : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Destacados</option>
                <option value="false">Regulares</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          {hasActiveFilters() && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Limpiar todos los filtros</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click away para cerrar historial */}
      {showHistory && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default AdvancedSearch;