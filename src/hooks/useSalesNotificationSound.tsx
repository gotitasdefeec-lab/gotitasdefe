import { useEffect, useRef } from 'react';
import { salesApi } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { getToken } from '../services/authService';

const CASH_REGISTER_SOUND = '/cash-register.mp3';

export function useSalesNotificationSound() {
  const { addNotification } = useNotifications();
  const lastSaleIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // No ejecutar si no hay token (evita llamadas en la pantalla de login)
    const token = getToken();
    if (!token) {
      return;
    }

    // Inicializa el último ID de venta
    salesApi.getAll().then(res => {
      const salesData = Array.isArray(res) ? res : (res.data || []);
      if (salesData.length > 0) {
        lastSaleIdRef.current = Math.max(...salesData.map((s: any) => Number(s.id)));
      }
    });

    const interval = setInterval(async () => {
      try {
        const res = await salesApi.getAll();
        const salesData = Array.isArray(res) ? res : (res.data || []);
        if (salesData.length > 0) {
          const maxId = Math.max(...salesData.map((s: any) => Number(s.id)));
          if (lastSaleIdRef.current !== null && maxId > lastSaleIdRef.current) {
            // Nueva venta detectada
            addNotification('¡Nueva venta recibida!', 'success', { category: 'sales', showToast: true });
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }
          lastSaleIdRef.current = maxId;
        }
      } catch {}
  }, 2000); // cada 2 segundos
    return () => clearInterval(interval);
  }, [addNotification]);

  // Elemento de audio para el sonido
  const AudioElement = (
    <audio ref={audioRef} src={CASH_REGISTER_SOUND} preload="auto" style={{ display: 'none' }} />
  );

  return AudioElement;
}
