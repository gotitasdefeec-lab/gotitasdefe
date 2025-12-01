import axios from 'axios';

// Bases configurables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001'; // Backend NestJS
const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'http://localhost:4001'; // Backend NestJS
// Named export for building absolute asset URLs in UI components
export const API_URL = PUBLIC_API_BASE_URL;

// Create axios instance
// Cliente para JSON Server (admin/mock)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // Bypass ngrok browser warning
  },
});

// Cliente para el backend público (Nest)
export const publicApi = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // Bypass ngrok browser warning
  },
});

// Customer authentication (separate from admin)
let customerToken: string | null = null;


export const setCustomerToken = (token: string) => {
  customerToken = token;
  localStorage.setItem('customer_token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  publicApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};


export const removeCustomerToken = () => {
  customerToken = null;
  localStorage.removeItem('customer_token');
  delete api.defaults.headers.common['Authorization'];
  delete publicApi.defaults.headers.common['Authorization'];
};


export const getCustomerToken = (): string | null => {
  if (customerToken) return customerToken;
  if (typeof window !== 'undefined') {
    customerToken = localStorage.getItem('customer_token');
    if (customerToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`;
      publicApi.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`;
    }
  }
  return customerToken;
};

// Initialize token on app start
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('customer_token');
  if (token) {
    setCustomerToken(token);
  }
}

export default api;