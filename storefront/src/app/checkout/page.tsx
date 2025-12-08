'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { checkoutService } from '@/services/checkoutService';
import { storeService } from '@/services/storeService';
import { formatCurrency } from '@/utils/formatCurrency';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import type { ShippingMethodOption } from '@/components/checkout/ShippingMethodSelector';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import type { PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import Image from 'next/image';
import { API_URL } from '@/services/api';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PayPalButton from '@/components/checkout/PayPalButton';

// Función de ayuda para obtener la URL correcta de imagen
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

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  phone: string;
  cedula: string;
  address: string;
  city: string;
  postalCode?: string;
  email?: string;
  paymentMethod?: string;
  shippingMethodId?: string;
  notes?: string;
}

export default function CheckoutPage() {
  const { customer } = useCustomer();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<string>("");
  // Optional: bank info map by method for success page handoff
  const [bankInfoByMethod, setBankInfoByMethod] = useState<Record<string, string>>({});
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const [frontendError, setFrontendError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(50);
  const [currency, setCurrency] = useState<string>('USD');
  const [taxEnabled, setTaxEnabled] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [storeName, setStoreName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [paypalClientId, setPaypalClientId] = useState<string>('');
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    cedula: '',
    address: '',
    city: '',
    postalCode: '',
    email: '',
    paymentMethod: '',
    shippingMethodId: undefined,
    notes: ''
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.product.price * it.quantity, 0), [items]);
  const selectedMethod = useMemo(() => shippingMethods.find((m) => m.id === formData.shippingMethodId), [shippingMethods, formData.shippingMethodId]);
  const baseShipping = useMemo(() => (selectedMethod ? selectedMethod.cost : 5.99), [selectedMethod]);
  const shipping = useMemo(() => (subtotal >= freeShippingThreshold ? 0 : baseShipping), [subtotal, freeShippingThreshold, baseShipping]);
  const tax = useMemo(() => (taxEnabled ? subtotal * taxRate : 0), [taxEnabled, subtotal, taxRate]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  const ShippingMethodSelector = useMemo(
    () =>
      dynamic(() => import('@/components/checkout/ShippingMethodSelector'), {
        ssr: false,
        loading: () => null,
      }),
    []
  );
  const PaymentMethodSelector = useMemo(
    () =>
      dynamic(() => import('@/components/checkout/PaymentMethodSelector'), {
        ssr: false,
        loading: () => null,
      }),
    []
  );

  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        firstName: customer.name.split(' ')[0] || '',
        lastName: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        cedula: customer.cedula || ''
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (items.length === 0 && !isProcessing) { // Prevent redirect while processing order
      router.push('/cart');
    }
  }, [items.length, router, isProcessing]);

  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await storeService.getStoreConfig();
        setFreeShippingThreshold(config.shipping?.freeShippingMin ?? 50);
        setCurrency(config.general?.currency || 'USD');
        setStoreName(config.general?.name || 'Checkout');

        // Load PayPal Client ID if available
        if ((config.payment as any)?.paypalClientId) {
          setPaypalClientId((config.payment as any).paypalClientId);
        } else {
          // Fallback to sandbox test client ID for development
          setPaypalClientId('test');
        }

        if (config.payment?.methods && Array.isArray(config.payment.methods)) {
          if (config.payment.methods.length > 0 && typeof config.payment.methods[0] === 'object' && 'enabled' in (config.payment.methods[0] as any)) {
            const raw = (config.payment.methods as any[]).filter((m: any) => m && typeof m === 'object');
            const enabled = raw.filter((m: any) => m.enabled);
            const normalized = enabled.map((m: any) => ({
              key: String(m.key),
              label: String(m.label ?? m.key),
              enabled: Boolean(m.enabled),
              instructions: typeof m.instructions === 'string' ? m.instructions : undefined,
            }));
            setPaymentMethods(normalized);
            // Build bank info map if present on object methods
            const bankMap: Record<string, string> = {};
            for (const m of enabled) {
              if (typeof m.bankInfo === 'string' && m.bankInfo.trim()) {
                bankMap[String(m.key)] = String(m.bankInfo);
              }
            }
            setBankInfoByMethod(bankMap);
          } else if (config.payment.methods.length > 0 && typeof config.payment.methods[0] === 'string') {
            const instructionsMap = (config.payment as any).instructions || {};
            setPaymentMethods((config.payment.methods as string[]).map((key: string) => ({
              key,
              label: key,
              enabled: true,
              instructions: typeof instructionsMap[key] === 'string' ? instructionsMap[key] : undefined,
            })));
            if ((config.payment as any).instructions) {
              const infoText = Object.values((config.payment as any).instructions).join(' | ');
              setPaymentInfo(infoText);
            }
            // Also pick up bank info map if provided
            const bankInfoMap = (config.payment as any).bankInfo || (config.payment as any).bank_info || undefined;
            if (bankInfoMap && typeof bankInfoMap === 'object') {
              const map: Record<string, string> = {};
              for (const k of Object.keys(bankInfoMap)) {
                if (typeof bankInfoMap[k] === 'string' && bankInfoMap[k].trim()) {
                  map[k] = String(bankInfoMap[k]);
                }
              }
              setBankInfoByMethod(map);
            }
          } else {
            setPaymentMethods([]);
          }
        } else {
          setPaymentMethods([]);
          setPaymentInfo("");
        }

        try {
          const { publicApi } = await import('@/services/api');
          const logoResponse = await publicApi.get('/public/store/logo');
          if (logoResponse.data?.url) setLogoUrl(logoResponse.data.url);
        } catch (err) {
          console.warn('Could not load logo:', err);
        }

        setTaxEnabled(false);
        setTaxRate(0);

        const rates = config.shipping?.rates || [];
        const carriers = config.shipping?.carriers || [];
        const standardCost = Number(config.shipping?.standardCost ?? 5.99);

        const methods: ShippingMethodOption[] = rates
          .filter((r: any) => r.region && r.region.trim())
          .map((rate: any) => {
            const carrier = carriers.find((c: any) => c.id === rate.carrierId && c.enabled);
            const scopeLabel = rate.scope === 'pais' ? 'Nacional' : rate.scope === 'provincia' ? 'Provincial' : 'Local';
            const carrierName = carrier?.name || 'Envío estándar';

            return {
              id: `rate-${rate.id}`,
              name: `${carrierName} - ${rate.region}`,
              description: `Envío ${scopeLabel} a ${rate.region}`,
              cost: Number(rate.price) || 0,
              eta: rate.scope === 'ciudad' ? '1-2 días' : rate.scope === 'provincia' ? '2-3 días' : '3-5 días'
            };
          });

        if (methods.length === 0) {
          methods.push({
            id: 'standard',
            name: 'Envío estándar',
            description: 'Envío a todo el país',
            cost: standardCost,
            eta: '3-5 días'
          });
        }

        setShippingMethods(methods);
        if (methods.length > 0) {
          const cheapest = [...methods].sort((a, b) => a.cost - b.cost)[0];
          setFormData((prev) => ({ ...prev, shippingMethodId: cheapest.id }));
        }
      } catch (e) {
        console.warn('No se pudo cargar la configuración de la tienda, usando valores por defecto.');
      }
    };
    loadStoreConfig();
  }, []);

  useEffect(() => {
    try {
      router.prefetch('/checkout/success');
    } catch { }
  }, [router]);

  const formatPrice = (price: number) => formatCurrency(price, currency || 'USD', 'es-US');

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    return formData.firstName && formData.lastName && formData.phone && formData.cedula && formData.address && formData.city && formData.paymentMethod;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFrontendError(null);

    // Skip form submission if PayPal is selected (PayPal button handles it)
    if (formData.paymentMethod === 'paypal') {
      return;
    }

    if (!validateForm()) {
      setFrontendError('Por favor completa todos los campos requeridos.');
      return;
    }

    const outOfStock = items.find(item => item.quantity > item.product.stock);
    if (outOfStock) {
      setFrontendError(`No hay suficiente stock para "${outOfStock.product.name}".`);
      return;
    }

    setIsProcessing(true);

    const payload = {
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email || (customer?.email ?? ''),
      cedula: formData.cedula,
      shippingAddress: `${formData.address}, ${formData.city}`,
      shippingPhone: formData.phone,
      notes: formData.notes,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name
      })),
      subtotal: subtotal,
      total: total,
      shippingCost: shipping,
      shippingMethodName: selectedMethod?.name,
    };

    try {
      let orderResponse;
      if (customer) {
        orderResponse = await checkoutService.submitOrderForCustomer(payload);
      } else {
        orderResponse = await checkoutService.submitOrderForGuest(payload);
      }

      toast.success('¡Pedido realizado con éxito!');
      // Persist minimal handoff info for success page (payment method, order id, optional instructions/bank info)
      try {
        if (formData.paymentMethod) {
          localStorage.setItem('last_order_payment_method', formData.paymentMethod);
          // Save method-specific instructions if present
          const sel = paymentMethods.find(m => m.key === formData.paymentMethod);
          if (sel?.instructions) {
            localStorage.setItem('last_order_payment_instructions', sel.instructions);
          } else {
            localStorage.removeItem('last_order_payment_instructions');
          }
          // Save bank info snapshot if present
          const bankInfo = bankInfoByMethod[formData.paymentMethod];
          if (bankInfo) {
            localStorage.setItem('last_order_payment_bank_info', bankInfo);
          } else {
            localStorage.removeItem('last_order_payment_bank_info');
          }
        }
        if (orderResponse?.id) {
          localStorage.setItem('last_order_id', String(orderResponse.id));
        }
      } catch { }

      clearCart();
      router.push(`/checkout/success?orderId=${orderResponse.id}`);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Hubo un error al procesar tu pedido.';
      setFrontendError(errorMsg);
      toast.error(errorMsg);
    } finally {
      // Do not set isProcessing to false here, because the component will unmount.
    }
  };

  const handlePayPalSuccess = (orderId: number) => {
    try {
      localStorage.setItem('last_order_payment_method', 'paypal');
      localStorage.setItem('last_order_id', String(orderId));
    } catch { }
    clearCart();
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  const handlePayPalError = (error: string) => {
    setFrontendError(error);
    setIsProcessing(false);
  };

  // Conditional return is now after all hooks
  if (items.length === 0) {
    return <div className="text-center py-20">Redirigiendo al carrito...</div>;
  }

  const paypalInitialOptions = {
    clientId: paypalClientId || 'test',
    currency: currency || 'USD',
    intent: 'capture',
  };

  return (
    <PayPalScriptProvider options={paypalInitialOptions}>
      <div className="min-h-screen bg-gray-50">
        {frontendError && (
          <div className="max-w-xl mx-auto mt-6 mb-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-center">
            {frontendError}
          </div>
        )}
        <div className="sticky top-0 z-40">
          <CheckoutHeader storeName={storeName || "Checkout"} logoUrl={logoUrl} />
        </div>
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-700">Procesando tu pedido…</p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 min-h-screen">
            <div className="bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
              <div className="mb-8">
                <button onClick={() => router.push('/cart')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Volver al carrito
                </button>
                <h1 className="sr-only">Checkout</h1>
              </div>
              <form onSubmit={handleSubmitOrder} className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Información de contacto</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" placeholder="correo@ejemplo.com" required disabled={!!customer} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Dirección de envío</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                        <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                        <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cédula *</label>
                      <input type="text" inputMode="numeric" pattern="[0-9]{10}" value={formData.cedula} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 10) handleInputChange('cedula', val); }} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required placeholder="0123456789" maxLength={10} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                      <input type="text" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required placeholder="Calle y número" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                        <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal (opcional)</label>
                        <input type="text" inputMode="numeric" pattern="[0-9]{5,10}" value={formData.postalCode || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 10) handleInputChange('postalCode', val); }} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" placeholder="Ej: 170515" maxLength={10} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                      <input type="tel" inputMode="numeric" pattern="[0-9]{10}" value={formData.phone} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 10) handleInputChange('phone', val); }} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" required maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Método de envío</h2>
                  <ShippingMethodSelector methods={shippingMethods} value={formData.shippingMethodId} onChange={(id) => handleInputChange('shippingMethodId', id)} currency={currency} />
                  {subtotal >= freeShippingThreshold && <p className="text-sm text-green-700 mt-3 bg-green-50 border border-green-200 rounded-md p-3">✓ ¡Envío gratis! Tu pedido supera {formatPrice(freeShippingThreshold)}</p>}
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Método de pago</h2>
                  <PaymentMethodSelector value={formData.paymentMethod || ''} onChange={(method: string) => handleInputChange('paymentMethod', method)} methods={paymentMethods || []} />
                  {paymentInfo && <div className="text-sm text-gray-600 mt-2">{paymentInfo}</div>}
                </div>
                <div className="border-t border-gray-200 pt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas del pedido (opcional)</label>
                  <textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900" placeholder="Instrucciones especiales para el envío..."></textarea>
                </div>
                <div className="border-t border-gray-200 pt-8">
                  {formData.paymentMethod === 'paypal' ? (
                    <div>
                      {!validateForm() && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
                          Por favor completa todos los campos requeridos antes de proceder con el pago.
                        </div>
                      )}
                      {validateForm() && (
                        <PayPalButton
                          amount={total}
                          currency={currency}
                          orderData={{
                            customerName: `${formData.firstName} ${formData.lastName}`,
                            customerEmail: formData.email || (customer?.email ?? ''),
                            cedula: formData.cedula,
                            shippingAddress: `${formData.address}, ${formData.city}`,
                            shippingPhone: formData.phone,
                            notes: formData.notes,
                            items: items.map(item => ({
                              productId: item.product.id,
                              quantity: item.quantity,
                              price: item.product.price,
                              name: item.product.name
                            })),
                            subtotal: subtotal,
                            total: total,
                            shippingCost: shipping,
                            shippingMethodName: selectedMethod?.name,
                          }}
                          onSuccess={handlePayPalSuccess}
                          onError={handlePayPalError}
                        />
                      )}
                    </div>
                  ) : (
                    <button type="submit" disabled={!validateForm() || isProcessing} className="w-full bg-blue-600 text-white py-4 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {isProcessing ? 'Procesando...' : 'Completar pedido'}
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-12 border-l border-gray-200">
              <div className="lg:sticky lg:top-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center"><ShoppingBagIcon className="h-6 w-6 mr-2" />Resumen del pedido</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={getImageUrl(Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : (item.product.image || null))}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                          unoptimized
                          priority={index === 0}
                          fetchPriority={index === 0 ? 'high' : 'auto'}
                          sizes="(max-width: 768px) 64px, 96px"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{formatPrice(item.product.price)} × {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{formatPrice(item.product.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="text-gray-900 font-medium">{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span className="text-gray-900 font-medium">{shipping === 0 ? <span className="text-green-600">¡Gratis!</span> : formatPrice(shipping)}</span></div>
                  {taxEnabled && <div className="flex justify-between text-sm"><span className="text-gray-600">Impuestos ({(taxRate * 100).toFixed(0)}%)</span><span className="text-gray-900 font-medium">{formatPrice(tax)}</span></div>}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold"><span className="text-gray-900">Total</span><span className="text-gray-900">{formatPrice(total)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}