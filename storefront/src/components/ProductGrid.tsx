"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/components/layout/Layout';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
// Importamos la URL centralizada para no tener conflictos de variables
import { API_URL } from '@/services/api'; 

// 1. Helper para URL amigable (Slug)
const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^a-z0-9]+/g, '-') // Caracteres especiales a guiones
    .replace(/(^-|-$)+/g, ''); // Limpiar guiones extra
};

// 2. Helper de Imágenes corregido
const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return '/placeholder-product.svg';
  if (typeof imagePath !== 'string') return '/placeholder-product.svg';
  
  const path = imagePath.trim();
  
  // Si es base64 o URL absoluta (http...)
  if (path.startsWith('data:image') || path.startsWith('http')) {
    if (path.includes('via.placeholder.com')) {
      // Fix para placeholders viejos
      const m = path.match(/via\.placeholder\.com\/([0-9]+(?:x[0-9]+)?)/);
      const size = m && m[1] ? m[1] : '400x400';
      return `https://placehold.co/${size}`;
    }
    return path;
  }
  
  // Si es ruta relativa, usamos la API_URL correcta importada
  return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export default function ProductGrid({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const { openCart } = useCartDrawer();

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-10 md:mb-12">
          <div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-light tracking-wide text-gray-900 mb-2">
  Productos destacados
</h2>
            <div className="w-16 h-0.5 bg-blue-600"></div>
          </div>
          <Link 
            href="/products"
            className="group flex items-center gap-2 text-gray-600 hover:text-blue-600 font-light text-sm md:text-base transition-colors duration-300"
          >
            Ver todo
            <ChevronRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grilla de Productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {products.map((product, index) => {
            // Generamos la URL bonita: /products/1-camiseta-roja
            const productUrl = `/products/${product.id}-${createSlug(product.name)}`;
            
            // Decidimos qué imagen mostrar
            const imageToSHow = (product.images && product.images.length > 0) 
              ? product.images[0] 
              : product.image;

            return (
              <div
                key={product.id}
                className="group opacity-0 animate-fade-in"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <Link href={productUrl} className="block" prefetch={true}>
                  {/* Contenedor Imagen */}
                  <div className="relative overflow-hidden bg-gray-50 mb-4 aspect-square rounded-lg border border-gray-100">
                    <Image
                      src={getImageUrl(imageToSHow)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      quality={80}
                      unoptimized={true} // CRÍTICO: Permite cargar la imagen externa sin fallos
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  </div>

                  {/* Info Producto */}
                  <div className="space-y-3">
                    <h3 className="font-light text-gray-900 text-sm md:text-base line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-lg md:text-xl font-light text-gray-900">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product, 1);
                        openCart();
                      }}
                      className="w-full py-2.5 md:py-3 text-sm md:text-base font-light text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0"
                      title="Añadir al carrito"
                    >
                      Añadir al carrito
                    </button>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </section>
  );
}
