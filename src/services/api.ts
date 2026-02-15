import axios from 'axios';

// CORRECCIÓN: Usar la URL de producción correcta como respaldo
export const API_URL = process.env.REACT_APP_API_URL || 'https://api.gotasdefe.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
  timeout: 30000,
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('current_user');
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login')) {
          const params = new URLSearchParams({ redirect: currentPath });
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
  update: (id: string | number, data: any) => api.patch(`/products/${id}`, data), // Cambiado PUT a PATCH por seguridad
  delete: (id: string | number) => api.delete(`/products/${id}`),
};

// ... (El resto de tus exports: inventoryApi, salesApi, etc. déjalos igual)
// Solo asegúrate de copiar la parte superior donde definimos API_URL
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getByProductId: async (productId: string | number) => {
    const res = await api.get(`/inventory?productId=${productId}`);
    return res.data || null;
  },
  create: (data: any) => api.post('/inventory', data),
  updateStock: async (productId: string, quantity: number) => {
    let inv: any | null = null;
    try {
      const res = await api.get(`/inventory?productId=${productId}`);
      inv = res.data || null;
    } catch { }

    if (!inv) {
      try {
        const resById = await api.get(`/inventory/${productId}`);
        inv = resById.data || null;
      } catch { }
    }

    if (!inv || !inv.id) {
      // Si no existe inventario, intentar crearlo al vuelo
      try {
         const newInv = await api.post('/inventory', { productId: Number(productId), quantity });
         return newInv;
      } catch(e) {
         throw new Error('Inventario no encontrado y no se pudo crear');
      }
    }
    return api.put(`/inventory/${inv.id}`, { quantity });
  },
  registerMovement: async (
    idOrProductId: string | number,
    movement: { type: 'entrada' | 'salida'; quantity: number; reason?: string }
  ) => {
    let inv: any | null = null;
    try {
      const res = await api.get(`/inventory?productId=${idOrProductId}`);
      inv = res.data || null;
    } catch { }

    if (!inv) {
      try {
        const resById = await api.get(`/inventory/${idOrProductId}`);
        inv = resById.data || null;
      } catch { }
    }

    if (!inv) throw new Error('Inventario no encontrado');
    return api.patch(`/inventory/${inv.id}/movement`, movement);
  },
  getMovements: (productId: string) =>
    api.get(`/inventory/${productId}/movements`),
};

export const salesApi = {
  getAll: () => api.get('/sales'),
  getById: (id: string | number) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  update: (id: string | number, data: any) => api.patch(`/sales/${id}`, data),
  updateStatus: (id: string | number, status: string) => api.patch(`/sales/${id}`, { status }),
  delete: (id: string | number) => api.delete(`/sales/${id}`),
  cancel: (id: string | number, reason?: string) => api.patch(`/sales/${id}/cancel`, { reason }),
  refund: (id: string | number) => api.post(`/sales/${id}/refund`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const customersApi = {
  getAll: () => api.get('/customers'),
  getById: (id: string | number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string | number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string | number) => api.delete(`/customers/${id}`),
};

export const reportsApi = {
  getSalesStats: () => api.get('/reports/sales'),
  getInventoryStats: () => api.get('/reports/inventory'),
  getUserStats: () => api.get('/reports/users'),
};

export const storeApi = {
  getSettings: () => api.get('/store/settings'),
  updateSettings: (data: any) => api.put('/store/settings', data),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  delete: (id: number | string) => api.delete(`/categories/${id}`),
  update: (id: number | string, data: any) => api.patch(`/categories/${id}`, data),
};

export default api;