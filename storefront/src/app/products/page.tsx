import React from 'react';
import SimpleProductGrid from '@/components/products/SimpleProductGrid';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = (process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.gotasdefe.com').replace(/\/$/, '');

async function getProducts(categoryName?: string | null) {
  try {
    const url = categoryName
      ? `${BASE}/public/categories/${encodeURIComponent(categoryName!)}/products`
      : `${BASE}/public/products`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [] as any[];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (_) {
    return [] as any[];
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const categoryName = typeof sp?.category === 'string' ? sp.category : null;
  const products = await getProducts(categoryName);
  const title = categoryName ? `Categoría: ${categoryName}` : 'Todos los Productos';
  const subtitle = categoryName ? `Explora los productos de la categoría ${categoryName}` : 'Explora nuestro catálogo completo de productos';

  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SimpleProductGrid
          title={title}
          subtitle={subtitle}
          categoryName={categoryName}
          initialProducts={products}
        />
      </div>
    </div>
  );
}