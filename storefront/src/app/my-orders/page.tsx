'use client';

import React, { useEffect } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import Link from 'next/link';
import { ShoppingBagIcon, CubeIcon, TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

// Helper to get status color and icon
const getStatusDetails = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return { icon: CubeIcon, color: 'text-yellow-500', label: 'Pendiente' };
    case 'shipped':
      return { icon: TruckIcon, color: 'text-blue-500', label: 'Enviado' };
    case 'delivered':
      return { icon: CheckCircleIcon, color: 'text-green-500', label: 'Entregado' };
    case 'cancelled':
      return { icon: XCircleIcon, color: 'text-red-500', label: 'Cancelado' };
    default:
      return { icon: CubeIcon, color: 'text-gray-500', label: status };
  }
};

export default function MyOrdersPage() {
  const { orders, ordersLoading, fetchOrders } = useCustomer();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const renderSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center bg-white rounded-2xl shadow-md p-12">
      <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-300" />
      <h2 className="mt-4 text-xl font-semibold text-gray-800">No tienes pedidos aún</h2>
      <p className="mt-2 text-gray-500">Parece que no has realizado ninguna compra. ¡Explora nuestros productos!</p>
      <Link href="/products" className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-sm leading-tight uppercase rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
        Ver Productos
      </Link>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Mis Pedidos</h1>
          <p className="mt-2 text-lg text-gray-600">Aquí puedes encontrar el historial de todas tus compras.</p>
        </header>

        {ordersLoading ? renderSkeleton() : orders.length === 0 ? renderEmptyState() : (
          <div className="space-y-8">
            {orders.map((order) => {
              const StatusIcon = getStatusDetails(order.status).icon;
              const statusColor = getStatusDetails(order.status).color;
              const statusLabel = getStatusDetails(order.status).label;

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">Pedido <span className="text-blue-600">#{order.id}</span></h2>
                        <p className="text-sm text-gray-500 mt-1">Realizado el {new Date(order.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center font-semibold text-lg">
                        <StatusIcon className={`h-6 w-6 mr-2 ${statusColor}`} />
                        <span className={statusColor}>{statusLabel}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700 mb-3">Productos:</h3>
                    <ul className="space-y-4">
                      {order.items.map((item) => (
                        <li key={item.productId} className="flex items-start justify-between text-sm">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Image
                                src={item.product?.image || '/placeholder-product.svg'}
                                alt={item.product?.name || 'Product image'}
                                width={64}
                                height={64}
                                className="rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <Link href={`/products/${item.productId}`} className="text-gray-800 font-semibold hover:text-blue-600 transition-colors">
                                {item.product?.name || `Producto #${item.productId}`}
                              </Link>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-800 font-medium">${item.price.toFixed(2)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}