'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { API_URL } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/components/layout/Layout';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

interface ProductCardProps {
  product: Product;
  className?: string;
}

// Helper para construir una URL de imagen válida (base64, absoluta o ruta relativa del backend)
const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return '/placeholder-product.svg';
  if (typeof imagePath !== 'string') return '/placeholder-product.svg';
  const path = imagePath.trim();
  if (path.startsWith('data:image') || path.startsWith('http')) {
    // Reescribe via.placeholder.com si aparece, para evitar DNS issues
    if (path.includes('via.placeholder.com')) {
      const m = path.match(/via\.placeholder\.com\/([0-9]+(?:x[0-9]+)?)/);
      const size = m && m[1] ? m[1] : '400x400';
      return `https://placehold.co/${size}`;
    }
    return path;
  }
  return `${API_URL}${path}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const { addItem } = useCart();
  const { openCart } = useCartDrawer();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openCart();
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return formatCurrency(price, 'USD', 'es-US');
  };

  const primaryImage = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : (product.image || null);
  const imageUrl = getImageUrl(primaryImage);

  return (
    <div className={`group ${className}`}>
      <Link href={`/products/${product.id}`}>
        {/* Imagen */}
        <div className="relative overflow-hidden bg-gray-50 mb-4 aspect-square rounded-lg">
          <Image
            src={imageUrl}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Overlay sutil */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          
          {/* Badges minimalistas */}
          {product.featured && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-light text-gray-900">Destacado</span>
            </div>
          )}
          
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-light text-gray-900">Últimas unidades</span>
            </div>
          )}
          
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-light text-gray-900">Agotado</span>
            </div>
          )}
        </div>
        
        {/* Info del producto */}
        <div className="space-y-3">
          <h3 className="font-light text-gray-900 text-sm md:text-base line-clamp-2 group-hover:text-gray-600 transition-colors duration-300">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <p className="text-lg md:text-xl font-light text-gray-900">
              {formatPrice(product.price)}
            </p>
            
            {product.stock > 0 && (
              <span className="text-xs font-light text-gray-500">
                En stock
              </span>
            )}
          </div>
          
          {/* Botón de agregar al carrito */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="w-full py-2.5 md:py-3 text-sm md:text-base font-light text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0"
              title="Añadir al carrito"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Añadir al carrito</span>
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;