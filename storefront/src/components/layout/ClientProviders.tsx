"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import FaviconUpdater from '@/components/layout/FaviconUpdater';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';

// Carga perezosa del Toaster para no bloquear la hidratación inicial
const LazyToaster = dynamic(
  () => import('react-hot-toast').then((m) => m.Toaster),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [showToaster, setShowToaster] = React.useState(false);

  React.useEffect(() => {
    // Montar el Toaster tras el idle para mejorar INP y evitar costo inicial
    const onIdle = () => setShowToaster(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(onIdle);
    } else {
      const t = setTimeout(onIdle, 150);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <FaviconUpdater />
      <CustomerProvider>
        <CartProvider>
          {children}
          {showToaster && (
            <LazyToaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#363636', color: '#fff' },
              }}
            />
          )}
        </CartProvider>
      </CustomerProvider>
    </>
  );
}
