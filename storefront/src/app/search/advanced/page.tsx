'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedProductGrid from '@/components/products/EnhancedProductGrid';
import { AdvancedFilters } from '@/components/products/AdvancedSearch';

export const dynamic = 'force-dynamic';

function AdvancedSearchContent() {
  const searchParams = useSearchParams();
  const initialFilters: Partial<AdvancedFilters> = {};
  
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const inStock = searchParams.get('inStock');
  const featured = searchParams.get('featured');
  const sortBy = searchParams.get('sortBy');

  if (q) initialFilters.searchTerm = q;
  if (category) initialFilters.categoryId = parseInt(category);
  if (minPrice && maxPrice) {
    initialFilters.priceRange = [parseFloat(minPrice), parseFloat(maxPrice)];
  }
  if (inStock) initialFilters.inStock = inStock === 'true';
  if (featured) initialFilters.featured = featured === 'true';
  if (sortBy) initialFilters.sortBy = sortBy as any;

  const getPageTitle = () => {
    if (q) return `Búsqueda Avanzada: "${q}"`;
    return 'Búsqueda Avanzada de Productos';
  };

  const getPageSubtitle = () => {
    return 'Usa nuestros filtros avanzados para encontrar exactamente lo que buscas';
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

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando búsqueda...</div>
      </div>
    }>
      <AdvancedSearchContent />
    </Suspense>
  );
}
