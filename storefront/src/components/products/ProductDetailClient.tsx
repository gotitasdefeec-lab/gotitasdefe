"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/components/layout/Layout';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const Lightbox = dynamic(() => import('@/components/Lightbox'), { ssr: false });

// Helper to build valid image URLs (base64, absolute, or relative paths from backend)
const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return '/placeholder-product.svg';
  if (typeof imagePath !== 'string') return '/placeholder-product.svg';
  const path = imagePath.trim();
  if (path.startsWith('data:image') || path.startsWith('http')) return path;
  // For relative paths like /uploads/..., prepend API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gotasdefe.com';
  // Normalizar barras para evitar // en la URL
  const cleanUrl = API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${cleanUrl}/${cleanPath}`;
};

export default function ProductDetailClient({ product, relatedProducts }: { product: Product; relatedProducts: Product[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { openCart } = useCartDrawer();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const productImages = useMemo(() => {
    return Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ['/placeholder-product.svg'];
  }, [product]);

  const formatPrice = (price: number) => formatCurrency(price, 'USD', 'es-EC');

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 group font-light transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 lg:gap-16 mb-12 sm:mb-20">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden relative cursor-zoom-in group" onClick={() => setLightboxOpen(true)}>
              <Image
                key={selectedImageIndex}
                src={getImageUrl(productImages[selectedImageIndex])}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-light">Ver imagen completa</span>
            </div>

            {productImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border transition-all duration-300 focus:outline-none ${
                      selectedImageIndex === index ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={getImageUrl(image)} alt={`${product.name} ${index + 1}`} width={80} height={80} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {lightboxOpen && (
              <Lightbox images={productImages.map(img => getImageUrl(img))} initialIndex={selectedImageIndex} onClose={() => setLightboxOpen(false)} />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900">{formatPrice(product.price)}</span>
                {product.stock > 0 ? (
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-green-50 text-green-700 text-xs sm:text-sm font-light rounded-full border border-green-200">
                    {product.stock} disponibles
                  </span>
                ) : (
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gray-50 text-gray-600 text-xs sm:text-sm font-light rounded-full border border-gray-200">
                    Agotado
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <label className="text-sm font-light text-gray-700">Cantidad</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="p-2.5 sm:p-3 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="px-4 sm:px-6 py-2.5 sm:py-3 text-gray-900 font-light min-w-[50px] sm:min-w-[60px] text-center">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} disabled={quantity >= (product?.stock || 0)} className="p-2.5 sm:p-3 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button onClick={handleAddToCart} disabled={product.stock === 0 || addedToCart} className="flex-1 bg-gray-900 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-light hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 text-sm sm:text-base">
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{addedToCart ? '¡Agregado al carrito!' : product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}</span>
                  <span className="sm:hidden">{addedToCart ? 'Agregado' : product.stock === 0 ? 'Agotado' : 'Agregar'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-light text-gray-900 mb-2 sm:mb-3">Descripción</h3>
                <div className="text-sm sm:text-base text-gray-600 leading-relaxed prose prose-sm sm:prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: product.description || 'Sin descripción disponible.' }} />
                </div>
              </div>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-light text-gray-900 mb-2 sm:mb-3">Especificaciones</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 text-sm sm:text-base gap-4">
                      <span className="text-gray-600 capitalize flex-shrink-0">{key}:</span>
                      <span className="text-gray-900 font-medium text-right">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related products section temporarily removed for performance optimization */}
      </div>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0);} }
        .animate-fade-in { animation: fade-in 0.5s ease-out; will-change: opacity, transform; }
      `}</style>
    </div>
  );
}
