import api, { publicApi } from './api';
import { StoreConfig } from '@/types';

export const storeService = {
  // Get store configuration
  async getStoreConfig(): Promise<StoreConfig> {
    try {
      // Use the new public endpoint for complete store configuration
  const response = await publicApi.get('/public/store/config');
      
      if (response.data) {
        return {
            general: {
              ...(response.data.general || {
                name: 'Mi Tienda',
                description: 'La mejor tienda online',
                email: 'contacto@mitienda.com',
                phone: '+1234567890',
                address: 'Calle Principal 123',
                currency: 'USD'
              }),
              currency: response.data.general?.currency || 'USD'
            },
          theme: response.data.theme || {
            primaryColor: '#3B82F6',
            secondaryColor: '#1F2937',
            fontFamily: 'Inter',
            darkMode: false
          },
          social: response.data.social || {},
          shipping: response.data.shipping || {
            freeShippingThreshold: 100,
            shippingRates: [
              { zone: 'Local', rate: 5 },
              { zone: 'Nacional', rate: 15 }
            ]
          },
          payment: response.data.payment || {
            methods: ['credit_card', 'paypal'],
            instructions: {
              credit_card: 'Pago seguro con tarjeta de crédito',
              paypal: 'Pago rápido y seguro con PayPal'
            }
          }
        };
      }
      
      throw new Error('No data received');
    } catch (error) {
      console.error('Error fetching store config:', error);
      // Return default configuration
      return {
        general: {
          name: 'Mi Tienda',
          description: 'La mejor tienda online',
          email: 'contacto@mitienda.com',
          phone: '+1234567890',
          address: 'Calle Principal 123',
          currency: 'USD'
        },
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          fontFamily: 'Inter',
          darkMode: false
        },
        social: {},
        shipping: {
          freeShippingThreshold: 100,
          shippingRates: [
            { zone: 'Local', rate: 5 },
            { zone: 'Nacional', rate: 15 }
          ]
        },
        payment: {
          methods: ['credit_card', 'paypal'],
          instructions: {
            credit_card: 'Pago seguro con tarjeta de crédito',
            paypal: 'Pago rápido y seguro con PayPal'
          }
        }
      };
    }
  }
};