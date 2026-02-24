import { login, logout, AdminUser } from './authService';
import api from './api';

// Mockear el módulo de la API
jest.mock('./api');

let store: { [key: string]: string } = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  },
  writable: true,
});

describe('Auth Service', () => {
  const mockedApi = api as jest.Mocked<typeof api>;
  const mockUser: AdminUser = { id: 1, name: 'Test User', email: 'test@example.com' };

  beforeEach(() => {
    // Limpiar mocks y localStorage antes de cada prueba
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  describe('login', () => {
    it('debería guardar el token y el usuario en un login exitoso', async () => {
      const mockToken = 'fake-jwt-token';
      mockedApi.post.mockResolvedValue({
        data: { token: mockToken, user: mockUser },
      });

      const user = await login('test@example.com', 'password');

      // 1. Verifica que se llamó a la API
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });

      // 2. Verifica que el token y el usuario se guardaron en localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('current_user', JSON.stringify(mockUser));

      // 3. Verifica que el header de autorización por defecto fue configurado
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);

      // 4. Verifica que la función retorna los datos del usuario
      expect(user).toEqual(mockUser);
    });

    it('debería lanzar un error si las credenciales son incorrectas', async () => {
      const errorMessage = 'Credenciales incorrectas';
      mockedApi.post.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      // Verifica que la función login lance una excepción
      await expect(login('test@example.com', 'wrong-password')).rejects.toThrow(errorMessage);

      // Asegurarse de que no se guardó nada en localStorage
      expect(window.localStorage.getItem('auth_token')).toBeUndefined();
      expect(window.localStorage.getItem('current_user')).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('debería eliminar el token y el usuario del localStorage y de los headers de la api', () => {
      const mockToken = 'fake-jwt-token';
      // Simular un estado de login
      window.localStorage.setItem('auth_token', mockToken);
      window.localStorage.setItem('current_user', JSON.stringify(mockUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

      logout();

      // 1. Verifica que se eliminaron los datos de localStorage
      expect(window.localStorage.getItem('auth_token')).toBeUndefined();
      expect(window.localStorage.getItem('current_user')).toBeUndefined();

      // 2. Verifica que el header de autorización fue eliminado
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });
});
