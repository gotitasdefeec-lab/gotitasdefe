"use client";

import React, { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import '@/app/page-fade.css';
import { usePathname } from 'next/navigation';
import Header from './Header';
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
import Footer from './Footer';
// ...
// Contexto global para abrir/cerrar el carrito
interface CartDrawerContextType {
  openCart: () => void;
}
const CartDrawerContext = createContext<CartDrawerContextType>({ openCart: () => {} });
export const useCartDrawer = () => useContext(CartDrawerContext);
import { storeService } from '@/services/storeService';
import { publicApi } from '@/services/api';
import { StoreConfig } from '@/types';
import type { StorePolicy } from '@/services/policyService';

interface LayoutProps {
  children: ReactNode;
  initialStoreConfig?: StoreConfig | null;
  initialLogoUrl?: string;
  initialPolicies?: StorePolicy[];
}


const Layout: React.FC<LayoutProps> = ({ children, initialStoreConfig = null, initialLogoUrl = '', initialPolicies }) => {
  const pathname = usePathname();
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(initialStoreConfig);
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl);
  const [loading, setLoading] = useState<boolean>(!initialStoreConfig);
  const [fade, setFade] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      setFade(true);
      return;
    }
    setFade(false);
    const timeout = setTimeout(() => setFade(true), 10);
    return () => clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    if (initialStoreConfig) return; // ya viene hidratado desde el servidor
    const loadStoreConfig = async () => {
      try {
        const config = await storeService.getStoreConfig();
        setStoreConfig(config);
        // Load logo from public endpoint
        try {
          const logoResponse = await publicApi.get('/public/store/logo');
          if (logoResponse.data?.url) setLogoUrl(logoResponse.data.url);
        } catch (err) {
          console.warn('Could not load logo:', err);
        }
      } catch (error) {
        console.error('Error loading store configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoreConfig();
  }, [initialStoreConfig]);

  // Render inmediato sin pantallas de carga si datos están prehidratados
  if (loading) {
    return null;
  }

  return (
    <CartDrawerContext.Provider value={{ openCart: () => setIsCartOpen(true) }}>
      <div className={`min-h-screen flex flex-col${!isFirstRender ? ` page-fade${fade ? ' page-fade-enter-active' : ' page-fade-exit-active'}` : ''}`}> 
        {!(pathname && (pathname.startsWith('/checkout') || pathname.startsWith('/login') || pathname.startsWith('/register'))) && (
          <Header 
            storeName={storeConfig?.general.name} 
            logoUrl={logoUrl} 
            isCartOpen={isCartOpen} 
            setIsCartOpen={setIsCartOpen}
            aboutContent={storeConfig?.general.about}
            contactContent={storeConfig?.general.contact}
            socialLinks={storeConfig?.social}
          />
        )}
        <main className="flex-1">
          {children}
        </main>
        {!(pathname && pathname.startsWith('/checkout')) && (
          <Footer 
            storeInfo={storeConfig?.general}
            socialLinks={storeConfig?.social}
            policies={initialPolicies}
          />
        )}
        {/* Cart Drawer at root (outside Header) */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </CartDrawerContext.Provider>
  );
};

export default Layout;