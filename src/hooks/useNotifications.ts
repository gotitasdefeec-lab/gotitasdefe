import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface UseNotificationsProps {
  maxNotifications?: number;
  autoDeleteTime?: number;
  onNewNotification?: (notification: Notification) => void;
}

export const useNotifications = ({
  maxNotifications = 50,
  autoDeleteTime = 7 * 24 * 60 * 60 * 1000, // 7 días
  onNewNotification,
}: UseNotificationsProps = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((
    message: string,
    type: Notification['type'] = 'info',
    actionUrl?: string,
    actionLabel?: string,
  ) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: Date.now(),
      read: false,
      actionUrl,
      actionLabel,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      // Limpiar notificaciones antiguas
      return updated.filter(n => 
        (Date.now() - n.timestamp) <= autoDeleteTime || !n.read
      );
    });

    setUnreadCount(prev => prev + 1);
    onNewNotification?.(newNotification);

    return newNotification.id;
  }, [maxNotifications, autoDeleteTime, onNewNotification]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => {
        if (n.id === id && !n.read) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const getNotifications = useCallback((
    options: {
      onlyUnread?: boolean;
      type?: Notification['type'];
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

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }, [notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    getNotifications,
    clearAll,
  };
};

// Ejemplo de uso:
// const {
//   notifications,
//   unreadCount,
//   addNotification,
//   markAsRead,
//   markAllAsRead,
// } = useNotifications({
//   onNewNotification: (notification) => {
//     console.log('Nueva notificación:', notification);
//   },
// });

// // Agregar una notificación
// addNotification(
//   'El stock del producto XYZ está bajo',
//   'warning',
//   '/inventory/xyz',
//   'Ver Producto'
// );