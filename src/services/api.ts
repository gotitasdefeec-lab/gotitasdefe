import axios from 'axios';

// La URL de la API se carga desde una variable de entorno para flexibilidad en despliegues.
// Create React App requiere que las variables de entorno personalizadas comiencen con REACT_APP_.
export const API_URL = process.env.REACT_APP_API_URL || 'https://seamus-shapeliest-overstiffly.ngrok-free.dev';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Evita la página intersticial de ngrok que puede causar errores de red en navegadores
    'ngrok-skip-browser-warning': '1',
  },
  timeout: 10000,
});

// Interceptor para manejar tokens de autenticación
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar errores comunes (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skipRedirect = error?.config?.headers?.['X-Skip-Auth-Redirect'] === 'true';
    
    if ((status === 401 || status === 403) && !skipRedirect) {
      // Limpiar sesión básica
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('current_user');
      // Redirigir al login si estamos en el navegador
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Evitar bucles si ya estamos en /login
        if (!currentPath.startsWith('/login')) {
          const params = new URLSearchParams({ redirect: currentPath });
          // Reemplazar en el historial para evitar vuelta a pantalla anterior con error
          window.location.replace(`/login?${params.toString()}`);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Productos
export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id: string | number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string | number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string | number) => api.delete(`/products/${id}`),
};

// Inventario
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getByProductId: async (productId: string | number) => {
    // Nest devuelve el objeto directamente, no en array
    const res = await api.get(`/inventory?productId=${productId}`);
    return res.data || null;
  },
  create: (data: any) => api.post('/inventory', data),
  updateStock: async (productId: string, quantity: number) => {
    // Nest backend: buscar por productId y actualizar por id
    let inv: any | null = null;
    try {
      const res = await api.get(`/inventory?productId=${productId}`);
      inv = res.data || null;
    } catch {}
    
    // Si no existe el inventory, intentar con el id directo
    if (!inv) {
      try {
        const resById = await api.get(`/inventory/${productId}`);
        inv = resById.data || null;
      } catch {}
    }
    
    if (!inv || !inv.id) {
      throw new Error('Inventario no encontrado para este producto');
    }
    
    // Nest usa PUT /inventory/:id con body { quantity }
    return api.put(`/inventory/${inv.id}`, { quantity });
  },
  registerMovement: async (
    idOrProductId: string | number,
    movement: { type: 'entrada' | 'salida'; quantity: number; reason?: string }
  ) => {
    // Buscar el inventory por productId primero
    let inv: any | null = null;
    try {
      const res = await api.get(`/inventory?productId=${idOrProductId}`);
      inv = res.data || null;
    } catch {}
    
    // O por id directo
    if (!inv) {
      try {
        const resById = await api.get(`/inventory/${idOrProductId}`);
        inv = resById.data || null;
      } catch {}
    }
    
    if (!inv) {
      throw new Error('Inventario no encontrado');
    }
    
    // Nest usa PATCH /inventory/:id/movement
    return api.patch(`/inventory/${inv.id}/movement`, movement);
  },
  getMovements: (productId: string) => 
    api.get(`/inventory/${productId}/movements`),
};

// Ventas
export const salesApi = {
  getAll: () => api.get('/sales'),
  getById: (id: string | number) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  update: (id: string | number, data: any) => api.patch(`/sales/${id}`, data),
  // Backwards-compatible helper for only status changes
  updateStatus: (id: string | number, status: string) => api.patch(`/sales/${id}`, { status }),
  delete: (id: string | number) => api.delete(`/sales/${id}`),
  cancel: (id: string | number, reason?: string) => api.patch(`/sales/${id}/cancel`, { reason }),
};

// Usuarios
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Clientes
export const customersApi = {
  getAll: () => api.get('/customers'),
  getById: (id: string | number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string | number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string | number) => api.delete(`/customers/${id}`),
};

// Reportes
export const reportsApi = {
  getSalesStats: () => api.get('/reports/sales'),
  getInventoryStats: () => api.get('/reports/inventory'),
  getUserStats: () => api.get('/reports/users'),
};

// Configuración de la tienda
export const storeApi = {
  getSettings: () => api.get('/store/settings'),
  updateSettings: (data: any) => api.put('/store/settings', data),
};

// Categorías
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  delete: (id: number | string) => api.delete(`/categories/${id}`),
  update: (id: number | string, data: any) => api.patch(`/categories/${id}`, data),
};

export default api;