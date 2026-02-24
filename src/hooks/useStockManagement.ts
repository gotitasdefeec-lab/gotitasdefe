import { useState, useCallback } from 'react';

interface StockMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'salida';
  quantity: number;
  reason: string;
  date: string;
  userId: string;
}

interface UseStockManagementProps {
  minStockThreshold?: number;
  maxStockThreshold?: number;
  onStockUpdate?: (newStock: number) => void;
  onStockAlert?: (type: 'low' | 'excess', stock: number) => void;
}

export const useStockManagement = ({
  minStockThreshold = 10,
  maxStockThreshold = 100,
  onStockUpdate,
  onStockAlert,
}: UseStockManagementProps = {}) => {
  const [stock, setStock] = useState(0);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStockLevels = useCallback((currentStock: number) => {
    if (currentStock <= minStockThreshold) {
      onStockAlert?.('low', currentStock);
    } else if (currentStock >= maxStockThreshold) {
      onStockAlert?.('excess', currentStock);
    }
  }, [minStockThreshold, maxStockThreshold, onStockAlert]);

  const addMovement = useCallback(async (movement: Omit<StockMovement, 'id' | 'date'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular una llamada a la API
      const newMovement: StockMovement = {
        ...movement,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
      };

      const newStock = movement.type === 'entrada'
        ? stock + movement.quantity
        : stock - movement.quantity;

      if (newStock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      setStock(newStock);
      setMovements(prev => [...prev, newMovement]);
      checkStockLevels(newStock);
      onStockUpdate?.(newStock);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el stock');
    } finally {
      setLoading(false);
    }
  }, [stock, checkStockLevels, onStockUpdate]);

  const updateStockThresholds = useCallback((min?: number, max?: number) => {
    if (min !== undefined) {
      minStockThreshold = min;
    }
    if (max !== undefined) {
      maxStockThreshold = max;
    }
    checkStockLevels(stock);
  }, [stock, checkStockLevels]);

  const getStockStatus = useCallback(() => {
    if (stock <= minStockThreshold) {
      return 'bajo';
    } else if (stock >= maxStockThreshold) {
      return 'exceso';
    }
    return 'normal';
  }, [stock, minStockThreshold, maxStockThreshold]);

  const getMovementHistory = useCallback((limit?: number) => {
    return limit ? movements.slice(-limit) : movements;
  }, [movements]);

  const getStockTrend = useCallback(() => {
    if (movements.length < 2) return 'stable';
    
    const recentMovements = movements.slice(-5);
    const trend = recentMovements.reduce((acc, movement) => {
      return movement.type === 'entrada' ? acc + 1 : acc - 1;
    }, 0);

    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  }, [movements]);

  return {
    stock,
    movements,
    loading,
    error,
    addMovement,
    updateStockThresholds,
    getStockStatus,
    getMovementHistory,
    getStockTrend,
  };
};