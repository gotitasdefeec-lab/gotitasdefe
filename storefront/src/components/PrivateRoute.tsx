'use client';

import React, { useEffect } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { useRouter } from 'next/navigation';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { customer, isLoading } = useCustomer();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace('/login');
    }
  }, [isLoading, customer, router]);

  if (isLoading || !customer) {
    // Muestra un loader o un componente vacío mientras se verifica la autenticación
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
