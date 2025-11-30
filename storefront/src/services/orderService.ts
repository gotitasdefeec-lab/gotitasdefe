import api from './api';
import { publicOrderService } from './publicOrderService';

// Type definitions
interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
  }>;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
  notes?: string;
}

export const orderService = {
  // Create new order
  async createOrder(orderData: {
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod: string;
    shippingMethodId?: string;
    // extra shipping metadata from checkout selection
    shippingMethodName?: string;
    shippingCost?: number;
    shippingCarrier?: string;
    shippingRegion?: string;
    shippingScope?: string;
    shippingEta?: string;
    customerInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      cedula?: string;
    };
    notes?: string;
  }): Promise<Order> {
    try {
      // Use public order service if customer info is provided
      if (orderData.customerInfo) {
        const response = await publicOrderService.createOrder({
          items: orderData.items,
          customerInfo: orderData.customerInfo,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          shippingMethodId: orderData.shippingMethodId,
          shippingMethodName: orderData.shippingMethodName,
          shippingCost: orderData.shippingCost,
          shippingCarrier: orderData.shippingCarrier,
          shippingRegion: orderData.shippingRegion,
          shippingScope: orderData.shippingScope,
          shippingEta: orderData.shippingEta,
          notes: orderData.notes,
          cedula: orderData.customerInfo.cedula
        });

        // Calculate totals for frontend, prefer explicit shippingCost when provided
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = typeof orderData.shippingCost === 'number'
          ? orderData.shippingCost
          : publicOrderService.calculateShipping(orderData.shippingAddress, subtotal);
        const tax = 0; // publicOrderService.calculateTax now returns 0
        const total = subtotal + shipping + tax;

        return {
          id: response.id.toString(),
          items: orderData.items,
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress,
          paymentMethod: orderData.paymentMethod,
          customerInfo: orderData.customerInfo,
          subtotal,
          tax,
          shipping,
          total,
          status: response.status || 'pending',
          createdAt: new Date().toISOString(),
          notes: orderData.notes
        };
      }

      // Fallback to original method if no customer info
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = await this.calculateShipping(orderData.shippingAddress, orderData.items);
  const tax = 0; // this.calculateTax now returns 0
      const total = subtotal + shipping + tax;

      const response = await api.post('/sales', {
        ...orderData,
        subtotal,
        shipping,
        tax,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}`,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Calculate shipping cost
  async calculateShipping(address: Address, items: Array<{ price: number; quantity: number }>): Promise<number> {
    // Basic shipping calculation
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping for orders over $50
    if (subtotal >= 50) {
      return 0;
    }

    // Different rates by country/city
    let baseRate = 5.99;
    
    if (address.country === 'Ecuador') {
      // Major cities get standard rate
      const majorCities = ['quito', 'guayaquil', 'cuenca', 'ambato'];
      if (majorCities.includes(address.city.toLowerCase())) {
        baseRate = 5.99;
      } else {
        baseRate = 8.99; // Rural areas
      }
    } else {
      baseRate = 15.99; // International shipping
    }

    // Add weight-based calculation if needed
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    if (itemCount > 5) {
      baseRate += (itemCount - 5) * 1.50; // Extra charge for many items
    }
    
    return Math.round(baseRate * 100) / 100;
  },

  // Calculate taxes
  async calculateTax(amount: number, address: Address): Promise<number> {
    // Taxes disabled by default
    return 0;
  },

  // Get shipping methods available for address
  async getShippingMethods(address: Address): Promise<Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
    estimatedDays: string;
  }>> {
    const methods = [];

    if (address.country === 'Ecuador') {
      const majorCities = ['quito', 'guayaquil', 'cuenca', 'ambato'];
      const isMajorCity = majorCities.includes(address.city.toLowerCase());

      methods.push({
        id: 'standard',
        name: 'Envío Estándar',
        description: isMajorCity ? 'Entrega en 1-2 días hábiles' : 'Entrega en 3-5 días hábiles',
        cost: isMajorCity ? 5.99 : 8.99,
        estimatedDays: isMajorCity ? '1-2' : '3-5'
      });

      if (isMajorCity) {
        methods.push({
          id: 'express',
          name: 'Envío Express',
          description: 'Entrega el mismo día o siguiente día hábil',
          cost: 12.99,
          estimatedDays: '0-1'
        });
      }
    } else {
      methods.push({
        id: 'international',
        name: 'Envío Internacional',
        description: 'Entrega en 7-15 días hábiles',
        cost: 25.99,
        estimatedDays: '7-15'
      });
    }

    return methods;
  }
};