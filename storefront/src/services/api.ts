import axios from 'axios';

// 1. Definir la URL base.
// En producción, buscará la variable de entorno 'NEXT_PUBLIC_API_URL'.
// Si no la encuentra, usará 'https://api.gotasdefe.com' como respaldo.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gotasdefe.com';

// 2. Crear instancias de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Este header ayuda si alguna vez usas ngrok, no afecta en producción
    'ngrok-skip-browser-warning': '69420',
  },
});

export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

// 3. Manejo de Autenticación de Clientes (Customer Token)
let customerToken: string | null = null;

export const setCustomerToken = (token: string) => {
  customerToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('customer_token', token);
  }
  // Configurar el header para futuras peticiones
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  publicApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeCustomerToken = () => {
  customerToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('customer_token');
  }
  delete api.defaults.headers.common['Authorization'];
  delete publicApi.defaults.headers.common['Authorization'];
};

export const getCustomerToken = (): string | null => {
  if (customerToken) return customerToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('customer_token');
    if (stored) {
      // Si encontramos el token en storage, lo restauramos en axios
      setCustomerToken(stored);
      return stored;
    }
  }
  return null;
};

// Restaurar token al cargar la app (solo en el navegador)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('customer_token');
  if (token) {
    setCustomerToken(token);
  }
}

export default api;