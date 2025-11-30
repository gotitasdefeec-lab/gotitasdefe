import { publicApi } from './api';
import { Customer, Order } from '@/types';

export const customerService = {
  // Customer registration
  async register(customerData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }): Promise<{ customer: Customer; token: string }> {
    const response = await publicApi.post('/customers', customerData);
    return response.data;
  },

  // Customer login
  async login(email: string, password: string): Promise<{ customer: Customer; token: string }> {
    const response = await publicApi.post('/customers/login', { email, password });
    return response.data;
  },

  // Get customer profile
  async getProfile(): Promise<Customer> {
    const response = await publicApi.get('/customers/profile');
    return response.data;
  },

  // Update customer profile
  async updateProfile(data: Partial<Customer>): Promise<Customer> {
    const response = await publicApi.put('/customers/profile', data);
    return response.data;
  },

  // Get customer orders
  async getOrders(): Promise<Order[]> {
    const response = await publicApi.get('/customers/orders');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  // Get specific order
  async getOrder(orderId: number): Promise<Order> {
    const response = await publicApi.get(`/customers/orders/${orderId}`);
    return response.data;
  }
};