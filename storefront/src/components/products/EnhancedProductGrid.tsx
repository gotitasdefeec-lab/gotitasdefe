'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import AdvancedSearch, { AdvancedFilters } from './AdvancedSearch';

interface EnhancedProductGridProps {
  initialFilters?: Partial<AdvancedFilters>;
  title?: string;
  subtitle?: string;
}

const EnhancedProductGrid: React.FC<EnhancedProductGridProps> = ({ 
  initialFilters,
  title = "Catálogo de Productos",
  subtitle = "Descubre nuestra amplia selección de productos"
}) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentFilters, setCurrentFilters] = useState<AdvancedFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleFiltersChange = useCallback((filters: AdvancedFilters, products: Product[]) => {
    console.log('EnhancedProductGrid: handleFiltersChange called', {
      filtersReceived: filters,
      productsCount: products.length
    });
    
    setFilteredProducts(products);
    setCurrentFilters(filters);
    setLoading(false);
    setHasInitialized(true);
  }, []);

  // Timeout de seguridad para evitar loading infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasInitialized) {
        console.warn('EnhancedProductGrid: Timeout reached, stopping loading state');
        setLoading(false);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [hasInitialized]);

  const getActiveFiltersCount = () => {
    if (!currentFilters) return 0;
    
    let count = 0;
    if (currentFilters.searchTerm) count++;
    if (currentFilters.categoryId) count++;
    if (currentFilters.inStock !== null) count++;
    if (currentFilters.featured !== null) count++;
    // No contar priceRange como filtro activo a menos que sea diferente del rango completo
    return count;
  };

  const getFiltersSummary = () => {
    if (!currentFilters) return '';
    
    const summary = [];
    if (currentFilters.searchTerm) {
      summary.push(`"${currentFilters.searchTerm}"`);
    }
    if (currentFilters.categoryId) {
      summary.push('categoría específica');
    }
    if (currentFilters.inStock === true) {
      summary.push('en stock');
    }
    if (currentFilters.inStock === false) {
      summary.push('agotados');
    }
    if (currentFilters.featured === true) {
      summary.push('destacados');
    }
    
    return summary.length > 0 ? ` para: ${summary.join(', ')}` : '';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-md bg-gray-200 h-10 flex-1"></div>
            <div className="rounded-md bg-gray-200 h-10 w-32"></div>
          </div>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y subtítulo */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Componente de búsqueda avanzada */}
      <AdvancedSearch 
        onFiltersChange={handleFiltersChange}
        initialFilters={initialFilters}
      />

      {/* Resumen de resultados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-700 font-medium">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            {getFiltersSummary()}
          </p>
          {getActiveFiltersCount() > 0 && (
            <p className="text-sm text-blue-600">
              {getActiveFiltersCount()} filtro{getActiveFiltersCount() !== 1 ? 's' : ''} activo{getActiveFiltersCount() !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Información de ordenamiento */}
        {currentFilters && (
          <div className="text-sm text-gray-500">
            Ordenado por: {
              currentFilters.sortBy === 'name' ? 'Nombre' :
              currentFilters.sortBy === 'price-low' ? 'Precio (menor a mayor)' :
              currentFilters.sortBy === 'price-high' ? 'Precio (mayor a menor)' :
              currentFilters.sortBy === 'newest' ? 'Más recientes' :
              currentFilters.sortBy === 'popular' ? 'Más populares' : 'Nombre'
            }
          </div>
        )}
      </div>

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                className="transform hover:scale-105 transition-transform duration-200"
              />
            ))}
          </div>

          {/* Mensaje si hay muchos productos */}
          {filteredProducts.length > 20 && (
            <div className="text-center py-8 bg-blue-50 rounded-lg">
              <p className="text-blue-700 mb-2">
                ¿Demasiados resultados? Intenta usar filtros más específicos.
              </p>
              <p className="text-sm text-blue-600">
                Usa la búsqueda por texto o selecciona una categoría específica.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.674-2.64"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {currentFilters?.searchTerm 
              ? `No hay productos que coincidan con "${currentFilters.searchTerm}"`
              : "No hay productos que coincidan con los filtros seleccionados"
            }
          </p>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Sugerencias:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Revisa la ortografía de tu búsqueda</li>
              <li>• Intenta con términos más generales</li>
              <li>• Reduce los filtros aplicados</li>
              <li>• Explora diferentes categorías</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProductGrid;