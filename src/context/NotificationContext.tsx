import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category?: 'stock' | 'sales' | 'system' | 'user' | 'product';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    message: string,
    type?: Notification['type'],
    options?: {
      actionUrl?: string;
      actionLabel?: string;
      category?: Notification['category'];
      showToast?: boolean;
    }
  ) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getNotifications: (options?: {
    onlyUnread?: boolean;
    type?: Notification['type'];
    category?: Notification['category'];
    limit?: number;
  }) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100;
const AUTO_DELETE_DAYS = 7;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<AlertColor>('info');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Guardar en localStorage cuando cambien las notificaciones
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  // Limpiar notificaciones antiguas
  useEffect(() => {
    const cleanOldNotifications = () => {
      const cutoffTime = Date.now() - (AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(n => n.timestamp > cutoffTime || !n.read)
      );
    };

    const interval = setInterval(cleanOldNotifications, 24 * 60 * 60 * 1000); // Una vez al día
    cleanOldNotifications(); // Ejecutar inmediatamente

    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((
    message: string,
    type: Notification['type'] = 'info',
    options: {
      actionUrl?: string;
      actionLabel?: string;
      category?: Notification['category'];
      showToast?: boolean;
    } = {}
  ) => {
    const newNotification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      read: false,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      category: options.category,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, MAX_NOTIFICATIONS);
    });

    // Mostrar toast si está habilitado
    if (options.showToast !== false) {
      setToastMessage(message);
      setToastType(type);
      setToastOpen(true);
    }

    return newNotification.id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getNotifications = useCallback((
    options: {
      onlyUnread?: boolean;
      type?: Notification['type'];
      category?: Notification['category'];
      limit?: number;
    } = {}
  ) => {
    let filtered = [...notifications];

    if (options.onlyUnread) {
      filtered = filtered.filter(n => !n.read);
    }

    if (options.type) {
      filtered = filtered.filter(n => n.type === options.type);
    }

    if (options.category) {
      filtered = filtered.filter(n => n.category === options.category);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }, [notifications]);

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        getNotifications,
      }}
    >
      {children}
      
      {/* Toast de notificaciones */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toastType}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
