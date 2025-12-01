export const dynamic = 'force-dynamic';
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, ArrowRightIcon, HomeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import { storeService } from '@/services/storeService';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [paymentBankInfo, setPaymentBankInfo] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const { clearCart } = useCart();

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await storeService.getStoreConfig();
        setStoreName(config.general?.name || 'Tienda');
        // Leer método elegido de storage para decidir si mostrar instrucciones/bancarios
        let chosen: string | null = null;
        try { chosen = localStorage.getItem('last_order_payment_method'); } catch {}
        if (chosen) setPaymentMethod(chosen);
        // Try to load snapshot saved at checkout time first
        try {
          const snapInstructions = localStorage.getItem('last_order_payment_instructions');
          const snapBankInfo = localStorage.getItem('last_order_payment_bank_info');
          if (snapInstructions && !paymentInstructions) setPaymentInstructions(snapInstructions);
          if (snapBankInfo && !paymentBankInfo) setPaymentBankInfo(snapBankInfo);
        } catch {}
        // Buscar instrucciones y bankInfo por método (si el backend las expone)
        const pay = config.payment;
        if (pay) {
          // Soportar dos formatos: array de objetos o array de strings con instructions por key
          if (Array.isArray((pay as any).methods) && (pay as any).methods.length > 0) {
            const first = (pay as any).methods[0];
            if (typeof first === 'object') {
              const m = (pay as any).methods.find((x: any) => x.key === chosen);
              if (m) {
                if (m.instructions && !paymentInstructions) setPaymentInstructions(m.instructions);
                if (m.bankInfo && !paymentBankInfo) setPaymentBankInfo(m.bankInfo);
              }
            } else if (typeof first === 'string' && chosen) {
              // Mapa de instrucciones opcional
              if ((pay as any).instructions) {
                const inst = (pay as any).instructions[chosen];
                if (inst && !paymentInstructions) setPaymentInstructions(inst);
              }
              // Mapa de datos bancarios opcional si existe para configuración basada en strings
              const bankInfoMap = (pay as any).bankInfo || (pay as any).bank_info || undefined;
              if (bankInfoMap && bankInfoMap[chosen]) {
                if (!paymentBankInfo) setPaymentBankInfo(bankInfoMap[chosen]);
              }
            }
          }
        }
        
        // Load logo from public endpoint
        try {
          const { publicApi } = await import('@/services/api');
          const logoResponse = await publicApi.get('/public/store/logo');
          if (logoResponse.data?.url) setLogoUrl(logoResponse.data.url);
        } catch (err) {
          console.warn('Could not load logo:', err);
        }
      } catch {}
    };
    loadStoreConfig();
  }, []);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
    } else {
      // Fallback to localStorage in case query param was lost
      try {
        const stored = localStorage.getItem('last_order_id');
        if (stored) {
          setOrderId(stored);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
    }
  }, [searchParams, router]);

  // Clear cart once when success page is confirmed
  useEffect(() => {
    if (!orderId) return;
    let done = false;
    if (!done) {
      try { clearCart(); } catch {}
    }
    return () => { done = true; };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Checkout header with logo and trust badges */}
      <div className="sticky top-0 z-40">
        <CheckoutHeader storeName={storeName || "Tienda"} logoUrl={logoUrl} />
      </div>
      <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">¡Pedido Confirmado!</h1>
            <p className="mt-2 text-lg text-gray-600">
              Tu pedido ha sido procesado exitosamente
            </p>
          </div>

          {/* Order Details */}
          <div className="px-6 py-8">
            {/* Payment instructions for bank transfer/deposit */}
            {paymentMethod && (paymentMethod === 'transferencia' || paymentMethod === 'deposito') && (
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Instrucciones de pago</h3>
                  {paymentInstructions && (
                    <p className="text-sm text-blue-800 whitespace-pre-line mb-3">{paymentInstructions}</p>
                  )}
                  {paymentBankInfo && (
                    <div className="text-sm text-blue-900 whitespace-pre-line">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">Datos bancarios</h4>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(paymentBankInfo);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            } catch {}
                          }}
                          className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          {copied ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <pre className="text-sm leading-relaxed bg-white rounded-md p-3 border border-blue-100 overflow-x-auto">{paymentBankInfo}</pre>
                    </div>
                  )}
                  {!paymentBankInfo && !paymentInstructions && (
                    <p className="text-sm text-blue-800">Por favor, realiza la transferencia a la cuenta indicada por la tienda y envía el comprobante para confirmar tu pedido.</p>
                  )}
                </div>
              </div>
            )}
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-800">Número de Pedido:</span>
                  <span className="text-lg font-bold text-blue-900">#{orderId}</span>
                </div>
                <p className="text-sm text-blue-700 text-center">
                  Guarda este número para hacer seguimiento a tu pedido
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Qué sigue ahora?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Confirmación por email</h4>
                    <p className="text-sm text-gray-600">
                      Te enviaremos un email con todos los detalles de tu pedido
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Preparación del pedido</h4>
                    <p className="text-sm text-gray-600">
                      Nuestro equipo preparará cuidadosamente tu pedido
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Envío y entrega</h4>
                    <p className="text-sm text-gray-600">
                      Te notificaremos cuando tu pedido esté en camino
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Necesitas ayuda?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">WhatsApp:</span>
                  <a href="https://wa.me/593991234567" className="ml-2 text-blue-600 hover:text-blue-800">
                    +593 99 123 4567
                  </a>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <a href="mailto:contacto@mitienda.com" className="ml-2 text-blue-600 hover:text-blue-800">
                    contacto@mitienda.com
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Volver al Inicio</span>
              </Link>
              
              <Link
                href="/products"
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                <span>Seguir Comprando</span>
              </Link>
            </div>

            {/* Order tracking info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  💡 Consejo: Guarda este número de pedido
                </h4>
                <p className="text-sm text-yellow-700">
                  Puedes usar el número de pedido <strong>#{orderId}</strong> para hacer seguimiento 
                  de tu envío o contactarnos si tienes alguna pregunta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}