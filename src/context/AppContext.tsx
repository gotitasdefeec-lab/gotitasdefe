import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../services/api';

interface AppState {
  darkMode: boolean;
  sidebarOpen: boolean;
  currentUser: User | null;
  loading: boolean;
  settings: AppSettings;
  authChecked: boolean; // Nueva bandera para saber si ya se validó el token
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  phone?: string;
  bio?: string;
}

interface AppSettings {
  language: 'es' | 'en';
  currency: string;
  dateFormat: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

type AppAction =
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESET_STATE' }
  | { type: 'SET_AUTH_CHECKED'; payload: boolean };

const getInitialState = (): AppState => {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  return {
    darkMode: false,
    sidebarOpen: true,
    currentUser: storedUser ? (JSON.parse(storedUser) as User) : null,
    loading: false,
    authChecked: false, // Inicialmente no está verificado
    settings: {
      language: 'es',
      currency: 'USD',
      dateFormat: 'DD/MM/YYYY',
      theme: {
        primaryColor: '#2196f3',
        secondaryColor: '#ff9800',
      },
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
    },
  };
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH_CHECKED':
      return { ...state, authChecked: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'RESET_STATE':
      return getInitialState();
    default:
      return state;
  }
};

interface AppContextType extends AppState {
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetState: () => void;
  addNotification: ReturnType<typeof useNotifications>['addNotification'];
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const { addNotification } = useNotifications();

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('currentUser');

      // Si no hay token o usuario, marcar como verificado y limpiar
      if (!token || !storedUser) {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
        dispatch({ type: 'SET_AUTH_CHECKED', payload: true });
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        return;
      }

      try {
        // Verificar token con redirección de auth desactivada para evitar parpadeos
        await api.get('/products?limit=1', {
          headers: { 'X-Skip-Auth-Redirect': 'true' },
        });
        // Si la petición es exitosa, el token es válido
        dispatch({ type: 'SET_AUTH_CHECKED', payload: true });
      } catch (error: any) {
        const status = error?.response?.status;
        const isNetwork = !status && (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network') || error?.message?.includes('timeout'));

        if (status === 401 || status === 403) {
          // Token inválido/expirado: limpiar sesión
          console.log('Token inválido o expirado, limpiando sesión...');
          dispatch({ type: 'SET_CURRENT_USER', payload: null });
          dispatch({ type: 'SET_AUTH_CHECKED', payload: true });
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
        } else if (isNetwork) {
          // Error de red/servidor caído: no cerrar sesión, solo marcar verificado
          console.log('No se pudo validar la sesión por error de red; manteniendo estado actual.');
          dispatch({ type: 'SET_AUTH_CHECKED', payload: true });
        } else {
          // Cualquier otro error: no cerrar sesión, solo continuar
          dispatch({ type: 'SET_AUTH_CHECKED', payload: true });
        }
      }
    };

    validateToken();
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'SET_DARK_MODE', payload: !state.darkMode });
  }, [state.darkMode]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !state.sidebarOpen });
  }, [state.sidebarOpen]);

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
    dispatch({ type: 'SET_AUTH_CHECKED', payload: true }); // Marcar como verificado
    try {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = {
    ...state,
    toggleDarkMode,
    toggleSidebar,
    setSidebarOpen,
    setCurrentUser,
    updateSettings,
    resetState,
    addNotification,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};