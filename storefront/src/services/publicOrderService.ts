import axios from 'axios';
import api, { publicApi } from './api';

export const publicOrderService = {
  // Create new order (public endpoint - no auth required)
  async createOrder(orderData: {
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      cedula?: string;
    };
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  shippingCost?: number;
  shippingCarrier?: string;
  shippingRegion?: string;
  shippingScope?: string;
  shippingEta?: string;
    notes?: string;
    cedula?: string;
  }) {
    try {
      // Calculate totals client-side
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      // Allow caller to pass a selected shipping cost via metadata in a future enhancement; for now keep logic consistent with checkout
  const shipping = subtotal >= 50 ? 0 : 5.99;
  // Do not apply taxes by default
  const tax = 0;
      const total = subtotal + shipping + tax;

      // Format data for backend
      const saleData = {
        customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        cedula: orderData.cedula || orderData.customerInfo.cedula || '',
        customerEmail: orderData.customerInfo.email || '',
        status: 'pending',
        total: total,
        subtotal: subtotal,
  // Keep IVA disabled by default (0%) unless enabled via store config
  taxPercent: 0,
        discountPercent: 0,
        items: orderData.items.map(item => ({
          productId: item.productId,
          name: '', // Product name will be populated by backend
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        notes: `Método de pago: ${orderData.paymentMethod}${orderData.notes ? `. ${orderData.notes}` : ''}`,
        shippingAddress: `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}`,
        shippingPhone: orderData.customerInfo.phone,
        shippingMethodId: orderData.shippingMethodId,
        shippingMethodName: orderData.shippingMethodName,
        shippingCost: orderData.shippingCost,
        shippingCarrier: orderData.shippingCarrier,
        shippingRegion: orderData.shippingRegion,
        shippingScope: orderData.shippingScope,
        shippingEta: orderData.shippingEta,
        date: new Date().toISOString(),
        attachments: []
      };

      // Send to backend
      const response = await publicApi.post('/public/orders', saleData);
      
      return {
        id: response.data.id || Date.now(), // Fallback ID
        ...saleData,
        shipping,
        tax
      };
    } catch (error) {
      console.error('Error creating order via /public/orders. Falling back to JSON server endpoints:', error);

      // Fallback path: operate directly against JSON-server (same base URL)
      try {
        // 1) Decrease stock for each item in /products and /inventory
        // Cliente limpio para JSON Server (sin Authorization)
        const jsonApi = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        for (const item of orderData.items) {
          if (!item.productId || !item.quantity) continue;
          try {
            // Update product stock
            const prodRes = await jsonApi.get(`/products/${item.productId}`);
            const product = prodRes?.data;
            if (product && product.id) {
              const newStock = Math.max(0, Number(product.stock || 0) - Number(item.quantity));
              await jsonApi.put(`/products/${product.id}`, { ...product, stock: newStock });

              // Update inventory stock (create if missing)
              try {
                const invQuery = await jsonApi.get(`/inventory?productId=${product.id}`);
                const invArr = Array.isArray(invQuery?.data) ? invQuery.data : [];
                const inv = invArr[0];
                if (inv && inv.id) {
                  await jsonApi.put(`/inventory/${inv.id}`, { ...inv, quantity: newStock });
                } else {
                  await jsonApi.post(`/inventory`, {
                    productId: Number(product.id),
                    quantity: newStock,
                    minStock: Number(product.minStock ?? 10),
                    maxStock: 100,
                    location: 'Almacén',
                    movements: [],
                    stockHistory: []
                  });
                }
              } catch (invErr) {
                console.warn('Inventory update fallback failed for product', product?.id, invErr);
              }
            }
          } catch (prodErr) {
            console.warn('Product update fallback failed for item', item?.productId, prodErr);
          }
        }

        // 2) Create sale in JSON-server so Admin can see/cancel it
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCalc = subtotal >= 50 ? 0 : 5.99;
        const shippingUsed = orderData.shippingCost != null ? orderData.shippingCost : shippingCalc;
        const total = subtotal + (Number(shippingUsed) || 0);
        const salePayload = {
          customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
          cedula: orderData.cedula || orderData.customerInfo.cedula || '',
          status: 'pending',
          total,
          subtotal,
          taxPercent: 0,
          discountPercent: 0,
          items: orderData.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          })),
          notes: orderData.notes || '',
          shippingAddress: `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}`,
          shippingPhone: orderData.customerInfo.phone,
          shippingMethodId: orderData.shippingMethodId,
          shippingMethodName: orderData.shippingMethodName,
          shippingCost: shippingUsed,
          shippingCarrier: orderData.shippingCarrier,
          shippingRegion: orderData.shippingRegion,
          shippingScope: orderData.shippingScope,
          shippingEta: orderData.shippingEta,
          date: new Date().toISOString(),
          attachments: [],
        };
  const saleRes = await jsonApi.post('/sales', salePayload);
        const created = saleRes?.data || { id: Date.now(), ...salePayload };

        return {
          id: created.id,
          ...salePayload,
          shipping: shippingUsed,
          tax: 0,
        };
      } catch (fallbackErr) {
        console.error('Fallback to JSON-server failed. Using localStorage as last resort.', fallbackErr);

        // Last resort: localStorage demo (so UI doesn't break in dev)
        const orderId = Date.now();
        const order = {
          id: orderId,
          ...orderData,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        const existingOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
        existingOrders.push(order);
        localStorage.setItem('demo_orders', JSON.stringify(existingOrders));
        return order;
      }
    }
  },

  // Calculate shipping cost
  calculateShipping(address: { city: string; country: string }, subtotal: number): number {
    // Free shipping for orders over $50
    if (subtotal >= 50) {
      return 0;
    }

    // Different rates by country/city
    let baseRate = 5.99;
    
    if (address.country === 'Ecuador') {
      const majorCities = ['quito', 'guayaquil', 'cuenca', 'ambato'];
      if (majorCities.includes(address.city.toLowerCase())) {
        baseRate = 5.99;
      } else {
        baseRate = 8.99; // Rural areas
      }
    } else {
      baseRate = 15.99; // International shipping
    }
    
    return Math.round(baseRate * 100) / 100;
  },

  // Calculate taxes
  calculateTax(amount: number, address: { country: string }): number {
    // Taxes disabled by default; return 0 unless explicitly enabled elsewhere
    return 0;
  }
};