'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedProductGrid from '@/components/products/EnhancedProductGrid';
import SimpleProductGrid from '@/components/products/SimpleProductGrid';
import { AdvancedFilters } from '@/components/products/AdvancedSearch';

export const dynamic = 'force-dynamic';

function SearchContent() {
  const searchParams = useSearchParams();
  
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const inStock = searchParams.get('inStock');
  const featured = searchParams.get('featured');
  const sortBy = searchParams.get('sortBy');

  const isSimpleSearch = q && !category && !minPrice && !maxPrice && !inStock && !featured && !sortBy;

  if (isSimpleSearch) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SimpleProductGrid 
            title={'Resultados de búsqueda'}
            subtitle="Productos encontrados en nuestro catálogo"
            searchQuery={q}
          />
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                ¿No encontraste lo que buscabas?
              </h3>
              <p className="text-blue-700 mb-4">
                Usa nuestra búsqueda avanzada para filtrar por categoría, precio y más opciones.
              </p>
              <a
                href={`/search/advanced?q=${encodeURIComponent(q)}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir a búsqueda avanzada
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initialFilters: Partial<AdvancedFilters> = {};
  
  if (q) initialFilters.searchTerm = q;
  if (category) initialFilters.categoryId = parseInt(category);
  if (minPrice && maxPrice) {
    initialFilters.priceRange = [parseFloat(minPrice), parseFloat(maxPrice)];
  }
  if (inStock) initialFilters.inStock = inStock === 'true';
  if (featured) initialFilters.featured = featured === 'true';
  if (sortBy) initialFilters.sortBy = sortBy as any;

  const getPageTitle = () => {
    if (q) return `Resultados para "${q}"`;
    if (category) return 'Búsqueda por Categoría';
    return 'Búsqueda Avanzada de Productos';
  };

  const getPageSubtitle = () => {
    if (q) return 'Encuentra exactamente lo que buscas con filtros avanzados';
    return 'Usa nuestros filtros avanzados para encontrar el producto perfecto';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EnhancedProductGrid 
          initialFilters={initialFilters}
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando resultados...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
