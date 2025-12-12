import React from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import ProductGrid from '@/components/ProductGrid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.gotasdefe.com';

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${BASE}/public/products/featured`, { 
      cache: 'no-store' // Disable cache to always get fresh data
    });
    if (!res.ok) {
      console.error('Failed to fetch featured products:', res.status);
      return [] as any[];
    }
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data?.data || [];
    console.log('Featured products fetched:', arr.length);
    return arr.slice(0, 8);
  } catch (err) {
    console.error('Error fetching featured products:', err);
    return [] as any[];
  }
}

async function getCarouselSlides() {
  try {
    const res = await fetch(`${BASE}/public/carousel`, { next: { revalidate: 3600 } });
    if (!res.ok) return [] as any[];
    return await res.json();
  } catch (_) {
    return [] as any[];
  }
}

export default async function HomePage() {
  const [featuredProducts, slides] = await Promise.all([
    getFeaturedProducts(),
    getCarouselSlides(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <HeroCarousel initialSlides={slides} />
      <ProductGrid products={featuredProducts} />
      <section className="py-16 md:py-20 lg:py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 mb-4 transition-transform duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-light text-gray-900 mb-2">Calidad garantizada</h3>
              <p className="text-sm md:text-base text-gray-500 font-light">
                Productos seleccionados con los más altos estándares
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 mb-4 transition-transform duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-light text-gray-900 mb-2">Envío rápido</h3>
              <p className="text-sm md:text-base text-gray-500 font-light">
                Entregas eficientes a todo el país
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 mb-4 transition-transform duration-500 group-hover:scale-110">
                <ChatBubbleLeftRightIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-900" />
              </div>
              <h3 className="text-lg md:text-xl font-light text-gray-900 mb-2">Soporte dedicado</h3>
              <p className="text-sm md:text-base text-gray-500 font-light">
                Asistencia personalizada para tus compras
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}