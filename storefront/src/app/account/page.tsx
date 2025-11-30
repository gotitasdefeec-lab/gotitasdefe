'use client';

import React from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightOnRectangleIcon, UserCircleIcon, ShoppingBagIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function AccountPage() {
  const { customer, logout, isLoading } = useCustomer();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customer) {
    router.push('/login');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Bienvenido, {customer.name}</h1>
          <p className="mt-2 text-lg text-gray-600">Gestiona tu información personal y tus pedidos.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
            <UserCircleIcon className="h-20 w-20 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">{customer.name}</h2>
            <p className="text-gray-500 mt-1">{customer.email}</p>
            <button 
              onClick={handleLogout}
              className="mt-6 flex items-center justify-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-500" />
              Cerrar Sesión
            </button>
          </div>

          {/* Navigation Cards */}
          <div className="space-y-6">
            <Link href="/my-orders" className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBagIcon className="h-10 w-10 text-blue-500" />
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-800">Mis Pedidos</h3>
                    <p className="text-gray-500 mt-1">Revisa el historial y estado de tus compras.</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-gray-400" />
              </div>
            </Link>
            
            {/* Placeholder for future options */}
            <div className="block bg-white rounded-2xl shadow-lg p-6 opacity-50 cursor-not-allowed">
              <div className="flex items-center">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-500">Editar Perfil</h3>
                  <p className="text-gray-400 mt-1">Próximamente</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}