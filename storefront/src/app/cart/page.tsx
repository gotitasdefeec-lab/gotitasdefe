'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/utils/formatCurrency';
import Link from 'next/link';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ShoppingBagIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { API_URL } from '@/services/api';
import { storeService } from '@/services/storeService';

// Función de ayuda para obtener la URL correcta
const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return '/placeholder-product.svg';
  if (typeof imagePath !== 'string') return '/placeholder-product.svg';
  const path = imagePath.trim();
  if (path.startsWith('data:image') || path.startsWith('http')) {
    if (path.includes('via.placeholder.com')) {
      const m = path.match(/via\.placeholder\.com\/([0-9]+(?:x[0-9]+)?)/);
      const size = m && m[1] ? m[1] : '96x96';
      return `https://placehold.co/${size}`;
    }
    return path;
  }
  // Normalizar barras para evitar // en la URL
  const cleanUrl = API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${cleanUrl}/${cleanPath}`;
};

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalPrice,
    getTotalItems 
  } = useCart();

  const [shippingThreshold, setShippingThreshold] = useState(50);
  const [shippingCost, setShippingCost] = useState(5.99);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await storeService.getStoreConfig();
        if (config.shipping) {
          // Prefer freeShippingThreshold, fallback to freeShippingMin, default to 50
          const threshold = config.shipping.freeShippingThreshold ?? config.shipping.freeShippingMin ?? 50;
          setShippingThreshold(Number(threshold));
          
          // Also update standard cost if available
          if (config.shipping.standardCost !== undefined) {
            setShippingCost(Number(config.shipping.standardCost));
          }
        }
      } catch (error) {
        console.error('Error fetching store config:', error);
      }
    };
    fetchConfig();
  }, []);

  const formatPrice = (price: number) => formatCurrency(price, 'USD', 'es-US');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Tu carrito está vacío</h2>
            <p className="mt-2 text-gray-600">¡Agrega algunos productos para empezar!</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  // Solo aplicar envío gratis si shippingThreshold > 0 Y subtotal >= threshold
  const shipping = (shippingThreshold > 0 && subtotal >= shippingThreshold) ? 0 : shippingCost;
  const tax = 0; // Impuestos deshabilitados por defecto
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 min-h-screen">
          {/* Left Column - Cart Items */}
          <div className="bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">Carrito de compras</h1>
              <p className="mt-1 text-sm text-gray-600">
                {getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}
              </p>
            </div>

            {/* Cart Items List */}
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-6 border-b border-gray-200 last:border-b-0">
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getImageUrl(Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : (item.product.image || null))}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      {item.product.name}
                    </h3>
                    {item.product.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {item.product.description}
                      </p>
                    )}
                    <p className="text-base font-semibold text-gray-900">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <MinusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        
                        <span className="px-4 py-1.5 text-sm font-medium text-gray-900 border-x border-gray-300 min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <PlusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>

                    {item.product.stock < 10 && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Solo quedan {item.product.stock} en stock
                      </p>
                    )}
                  </div>

                  {/* Item Total (Right aligned) */}
                  <div className="text-right">
                    <p className="text-base font-semibold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center"
              >
                ← Continuar comprando
              </Link>
            </div>
          </div>

          {/* Right Column - Order Summary (Sticky) */}
          <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-12 border-l border-gray-200">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <ShoppingBagIcon className="h-6 w-6 mr-2" />
                Resumen del pedido
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío estimado</span>
                  <span className="text-gray-900 font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">¡Gratis!</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                
                {shipping > 0 && shippingThreshold > 0 && subtotal < shippingThreshold && (
                  <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md p-3">
                    💡 ¡Agrega {formatPrice(shippingThreshold - subtotal)} más para envío gratis!
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="text-gray-900 font-medium">{formatPrice(tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Proceder al pago
                </Link>
                
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="space-y-3 text-sm text-gray-600">
                  {shippingThreshold > 0 && (
                    <div className="flex items-start gap-2">
                      <span>✓</span>
                      <span>Envío gratis en compras mayores a {formatPrice(shippingThreshold)}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Devoluciones gratis en 30 días</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Pago 100% seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}