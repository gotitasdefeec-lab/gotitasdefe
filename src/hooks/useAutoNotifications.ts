import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { productsApi, inventoryApi, salesApi } from '../services/api';
import { pushNotificationService } from '../services/pushNotificationService';

/**
 * Hook para generar notificaciones automáticas basadas en eventos del sistema
 */
export const useAutoNotifications = () => {
  const { addNotification } = useNotifications();
  const lastCheckRef = useRef<number>(Date.now());
  // Persistir productos notificados en localStorage
  const notifiedLowStockRef = useRef<Set<number>>(new Set(
    (() => {
      try {
        const raw = localStorage.getItem('notifiedLowStockIds');
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })()
  ));
  // Persistir ventas notificados en localStorage
  const notifiedSalesRef = useRef<Set<string>>(new Set(
    (() => {
      try {
        const raw = localStorage.getItem('notifiedSalesIds');
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })()
  ));

  useEffect(() => {
    const checkLowStock = async () => {
      try {
        const productsResponse = await productsApi.getAll();
        const products = productsResponse.data || [];
        const inventoryResponse = await inventoryApi.getAll();
        const inventory = inventoryResponse.data || [];

        const inventoryMap = new Map(
          inventory.map((inv: any) => [inv.productId, inv.quantity])
        );

        let changed = false;
        products.forEach((product: any) => {
          const stock = inventoryMap.get(product.id) ?? product.stock ?? 0;
          const minStock = product.minStock || 10;

          // Si el stock está bajo y no hemos notificado sobre este producto
          if (stock <= minStock && !notifiedLowStockRef.current.has(product.id)) {
            addNotification(
              `⚠️ Stock bajo: "${product.name}" tiene solo ${stock} unidades (mínimo: ${minStock})`,
              'warning',
              {
                actionUrl: '/inventory',
                actionLabel: 'Ver Inventario',
                category: 'stock',
                showToast: true,
              }
            );
            notifiedLowStockRef.current.add(product.id);
            changed = true;
          }

          // Si el stock vuelve a estar bien, remover de la lista de notificados
          if (stock > minStock && notifiedLowStockRef.current.has(product.id)) {
            notifiedLowStockRef.current.delete(product.id);
            changed = true;
          }
        });
        // Persistir ids notificados
        if (changed) {
          localStorage.setItem('notifiedLowStockIds', JSON.stringify(Array.from(notifiedLowStockRef.current)));
        }
      } catch (error) {
        console.error('Error checking low stock:', error);
      }
    };

    const checkNewSales = async () => {
      try {
        const salesResponse = await salesApi.getAll();
        const sales = salesResponse.data || [];

        // Solo notificar ventas nuevas que no estén en notifiedSalesRef
        let changed = false;
        const newSales = sales.filter((sale: any) => {
          const saleId = String(sale.id);
          return !notifiedSalesRef.current.has(saleId);
        });

        if (newSales.length > 0) {
          const totalAmount = newSales.reduce(
            (sum: number, sale: any) => sum + Number(sale.total || 0),
            0
          );

          addNotification(
            `🎉 ${newSales.length} nueva${newSales.length > 1 ? 's' : ''} venta${newSales.length > 1 ? 's' : ''} por $${totalAmount.toFixed(2)}`,
            'success',
            {
              actionUrl: '/sales',
              actionLabel: 'Ver Ventas',
              category: 'sales',
              showToast: true,
            }
          );
          newSales.forEach((sale: any) => {
            notifiedSalesRef.current.add(String(sale.id));
            changed = true;
          });
        }
        // Persistir ids notificados
        if (changed) {
          localStorage.setItem('notifiedSalesIds', JSON.stringify(Array.from(notifiedSalesRef.current)));
        }
        lastCheckRef.current = Date.now();
      } catch (error) {
        console.error('Error checking new sales:', error);
      }
    };

    // Ejecutar checks inmediatamente
    checkLowStock();

    // Ejecutar checks periódicamente
    const lowStockInterval = setInterval(checkLowStock, 5 * 60 * 1000); // Cada 5 minutos
    const salesInterval = setInterval(checkNewSales, 2 * 60 * 1000); // Cada 2 minutos

    return () => {
      clearInterval(lowStockInterval);
      clearInterval(salesInterval);
    };
  }, [addNotification]);

  // Notificación de bienvenida (solo una vez)
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('welcomeNotificationShown');
    
    if (!hasShownWelcome) {
      const currentHour = new Date().getHours();
      let greeting = 'Buenos días';
      if (currentHour >= 12 && currentHour < 19) greeting = 'Buenas tardes';
      if (currentHour >= 19) greeting = 'Buenas noches';

      addNotification(
        `👋 ${greeting}! Bienvenido al panel de administración`,
        'info',
        {
          category: 'system',
          showToast: true,
        }
      );

      sessionStorage.setItem('welcomeNotificationShown', 'true');
    }
  }, [addNotification]);

  return null;
};
