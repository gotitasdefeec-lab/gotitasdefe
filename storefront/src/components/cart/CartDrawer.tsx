'use client';

import React, { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/utils/formatCurrency';
import Link from 'next/link';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { API_URL } from '@/services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper para obtener URL correcta (base64, absoluta o relativa del backend)
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
  return `${API_URL}${path}`;
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Bloquear scroll del body cuando el carrito está abierto y cerrar con ESC
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Guardar foco previo y enfocar el diálogo para lectores de pantalla
      previousFocusRef.current = (document.activeElement as HTMLElement) || null;
      // Enfocar tras el paint
      setTimeout(() => {
        containerRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = previousOverflow || '';
      // Restaurar foco previo si existe
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Gesture: deslizar para cerrar (móvil)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const THRESHOLD_X = 80; // px
  const MAX_ANGLE_Y = 40; // tolerancia vertical

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = Math.abs(t.clientY - touchStartY.current);
    if (dx > THRESHOLD_X && dy < MAX_ANGLE_Y) {
      // cerrar y resetear
      touchStartX.current = null;
      touchStartY.current = null;
      onClose();
    }
  };
  const onTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Focus trap dentro del drawer
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = containerRef.current;
    if (!root) return;
    const focusableSelectors = [
      'a[href]','area[href]','button:not([disabled])','input:not([disabled])',
      'select:not([disabled])','textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(focusableSelectors))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);

    if (focusables.length === 0) {
      e.preventDefault();
      root.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'USD', 'es-EC');
  };

  const subtotal = getTotalPrice();

  return (
    <>
      {/* Backdrop - transparencia real con rgba */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] transition-opacity"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`fixed inset-y-0 right-0 w-full sm:w-[22rem] lg:w-[24rem] bg-white border-l border-gray-200 z-[100] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        tabIndex={-1}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="h-5 w-5 text-gray-900" />
              <h2 id="cart-drawer-title" className="text-lg font-light text-gray-900">Carrito</h2>
              {getTotalItems() > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200 font-light">
                  {getTotalItems()}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-white">
              <ShoppingBagIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-gray-600 mb-4 font-light">Tu carrito está vacío</p>
              <button
                onClick={onClose}
                className="text-gray-700 hover:text-gray-900 font-light underline underline-offset-4"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-5 pb-5 border-b border-gray-200">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <Link href={`/products/${item.product.id}`} aria-label={`Ver ${item.product.name}`}>
                          <img
                            src={getImageUrl(Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : (item.product.image || null))}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded-md border border-gray-200"
                          />
                        </Link>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product.id}`} className="hover:underline underline-offset-2">
                          <h3 className="text-base font-light text-gray-900 line-clamp-2 mb-1">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-base font-light text-gray-900 mb-2">{formatPrice(item.product.price)}</p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <MinusIcon className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <span className="px-3 py-1.5 text-sm font-light text-gray-900 border-x border-gray-300 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                              disabled={item.quantity >= item.product.stock}
                            >
                              <PlusIcon className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-xs text-gray-600 hover:text-gray-900 font-light underline underline-offset-2"
                          >
                            Eliminar
                          </button>
                        </div>

                        {/* Stock warning */}
                        {item.product.stock < 10 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Quedan {item.product.stock} unidades
                          </p>
                        )}
                      </div>

                       {/* Removed per-item total (redundant with subtotal) */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer with Subtotal and Checkout */}
              <div className="border-t border-gray-200 px-6 py-5 space-y-4 bg-white">
                <div className="flex justify-between text-base font-light">
                  <span className="text-gray-900">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <p className="text-xs text-gray-500">
                  Impuestos y envío se calculan en el checkout
                </p>

                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full bg-gray-900 text-white text-center px-6 py-3.5 rounded-lg font-light hover:bg-gray-800 transition-colors"
                >
                  Ir al pago
                </Link>

                <button
                  onClick={onClose}
                  className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 font-light"
                >
                  Seguir comprando
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
