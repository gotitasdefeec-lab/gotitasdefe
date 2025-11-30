import { publicApi } from './api';

// Define the structure of the cart items and shipping details
interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
}

interface ShippingDetails {
  customerName: string;
  customerEmail: string;
  cedula?: string;
  shippingAddress: string;
  shippingPhone: string;
  notes?: string;
}

interface OrderPayload extends ShippingDetails {
  items: CartItem[];
  subtotal: number;
  total: number;
  shippingCost?: number;
}

export const checkoutService = {
  /**
   * Submits an order for an authenticated customer.
   */
  async submitOrderForCustomer(payload: OrderPayload): Promise<any> {
    const response = await publicApi.post('/public/checkout', payload);
    return response.data;
  },

  /**
   * Submits an order for a guest.
   */
  async submitOrderForGuest(payload: OrderPayload): Promise<any> {
    const response = await publicApi.post('/public/orders', payload);
    return response.data;
  },
};
