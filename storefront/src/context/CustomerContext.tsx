'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Customer, Order } from '@/types';
import { customerService } from '@/services/customerService';
import { setCustomerToken, removeCustomerToken, getCustomerToken } from '@/services/api';

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  orders: Order[];
  ordersLoading: boolean;
  fetchOrders: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (customerData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};


interface CustomerProviderProps {
  children: ReactNode;
}


export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await customerService.getOrders();
      setOrders(data);
    } catch (error) {
      setOrders([]);
      console.error('Error al obtener pedidos:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeCustomer = async () => {
      const token = getCustomerToken();
      if (token) {
        try {
          const customerData = await customerService.getProfile();
          setCustomer(customerData);
        } catch (error) {
          console.error('Error loading customer profile:', error);
          removeCustomerToken();
        }
      }
      setIsLoading(false);
    };
    initializeCustomer();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { customer: customerData, token } = await customerService.login(email, password);
      setCustomerToken(token);
      setCustomer(customerData);
    } catch (error) {
      // No mostrar error en consola para login fallido
      throw error;
    }
  }, []);

  const register = useCallback(async (customerData: any) => {
    try {
      const { customer: newCustomer, token } = await customerService.register(customerData);
      setCustomerToken(token);
      setCustomer(newCustomer);
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        throw new Error('El correo ya está registrado.');
      }
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    removeCustomerToken();
    setCustomer(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Customer>) => {
    try {
      const updatedCustomer = await customerService.updateProfile(data);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }, []);

  const value: CustomerContextType = {
    customer,
    isLoading,
    orders,
    ordersLoading,
    fetchOrders,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};