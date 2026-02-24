import api from './api';

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

export type LoginResponse = {
  token: string;
  user: AdminUser;
};

// Real JWT login for NestJS backend
export async function login(email: string, password: string): Promise<AdminUser> {
  try {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    const { token, user } = res.data;

    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));

    // Set default Authorization header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return user;
  } catch (error: any) {
    const strictBackend = (process.env.REACT_APP_STRICT_BACKEND || '').toLowerCase() === 'true' || process.env.REACT_APP_STRICT_BACKEND === '1';
    // Si el backend real no está disponible o devuelve 404, intenta login mock (JSON Server)
    const status = error?.response?.status;
    const isNetwork = !status && (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network'));
    if (!strictBackend && (status === 404 || isNetwork)) {
      const user = await loginMock(email, password);
      // Configurar un token simulado para mantener el flujo del resto de llamadas
      const mockToken = 'mock-token';
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      return user;
    }

    const message = error?.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
}

// Fallback to mock for development (when backend is not available)
export async function loginMock(email: string, password: string): Promise<AdminUser> {
  // json-server supports filtering with ?email=
  const res = await api.get<({ id: number; name: string; email: string; password: string })[]>('/admin', { params: { email } });
  const admin = res.data[0];
  if (!admin) {
    throw new Error('Usuario no encontrado');
  }
  if (admin.password !== password) {
    throw new Error('Credenciales incorrectas');
  }
  const { password: _p, ...user } = admin;
  return user;
}

// Get current user from localStorage
export function getCurrentUser(): AdminUser | null {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
}

// Get current token
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Logout
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  delete api.defaults.headers.common['Authorization'];
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Initialize auth state on app load
export function initializeAuth(): void {
  const token = getToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// Cambiar contraseña de administrador
export async function changeAdminPassword(email: string, oldPassword: string, newPassword: string, confirmPassword?: string): Promise<string> {
  console.log('🌐 authService.changeAdminPassword llamado');
  console.log('📧 Email:', email);
  console.log('🔑 oldPassword length:', oldPassword.length);
  console.log('🔑 newPassword length:', newPassword.length);
  
  try {
    console.log('📤 Enviando POST a /auth/change-password...');
    const res = await api.post<{ message: string }>('/auth/change-password', {
      email,
      oldPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword, // Si no se pasa, usa newPassword
    });
    console.log('📥 Respuesta recibida:', res.data);
    return res.data.message;
  } catch (error: any) {
    console.error('❌ Error en changeAdminPassword:', error);
    console.error('❌ Response data:', error?.response?.data);
    const message = error?.response?.data?.message || 'Error al cambiar la contraseña';
    throw new Error(message);
  }
}

// Verificar contraseña actual del administrador
export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  console.log('🔍 verifyAdminPassword - Email:', email);
  console.log('🔍 verifyAdminPassword - Password length:', password.length);
  console.log('🔍 verifyAdminPassword - Password:', password);
  
  try {
    const res = await api.post<{ valid: boolean; message: string }>(
      '/auth/verify-password', 
      { email, password },
      {
        // Evitar que el interceptor redirija al login en caso de error 401
        headers: { 'X-Skip-Auth-Redirect': 'true' }
      }
    );
    console.log('✅ Verificación exitosa:', res.data);
    return res.data.valid;
  } catch (error: any) {
    console.log('❌ Error en verificación:', error.response?.data || error.message);
    // Si es 401, significa que la contraseña es incorrecta, no que la sesión expiró
    return false;
  }
}
