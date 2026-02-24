"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CartItem, Product } from '@/types';

import { productService } from '@/services/productService';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount and refresh prices
  useEffect(() => {
    let mounted = true;

    const loadAndRefreshCart = async () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            // Check if we have minimal cart items (productId + quantity only)
            const isMinimalFormat = parsedCart.length > 0 && 
              parsedCart[0].productId !== undefined && 
              parsedCart[0].product === undefined;

            if (isMinimalFormat) {
              // Hydrate minimal cart items with full product data
              const hydrated = await Promise.all(
                parsedCart.map(async (item: { productId: number; quantity: number; id: number }) => {
                  try {
                    const freshProduct = await productService.getProduct(item.productId);
                    if (freshProduct) {
                      return {
                        id: item.id,
                        product: {
                          ...freshProduct,
                          price: Number(freshProduct.price)
                        },
                        quantity: item.quantity
                      };
                    }
                    return null;
                  } catch (e) {
                    console.error('Error fetching product:', e);
                    return null;
                  }
                })
              );

              const validItems = hydrated.filter(item => item !== null) as CartItem[];
              if (mounted) {
                setItems(validItems);
              }
            } else {
              // Legacy format: full product objects stored
              if (mounted) setItems(parsedCart);

              // Fetch fresh data for each product
              const updatedItems = await Promise.all(
                parsedCart.map(async (item: CartItem) => {
                  try {
                    const freshProduct = await productService.getProduct(item.product.id);
                    if (freshProduct) {
                      return {
                        ...item,
                        product: {
                          ...freshProduct,
                          price: Number(freshProduct.price)
                        }
                      };
                    }
                    return item;
                  } catch (e) {
                    return item;
                  }
                })
              );

              if (mounted) {
                setItems(updatedItems);
              }
            }
          } else {
            localStorage.removeItem('cart');
          }
        } catch (error) {
          console.error('Error loading cart:', error);
          localStorage.removeItem('cart');
        }
      }
      if (mounted) setIsLoaded(true);
    };

    loadAndRefreshCart();

    return () => {
      mounted = false;
    };
  }, []);

  // Save cart to localStorage whenever items change, but only after initial load
  // Store minimal data to avoid QuotaExceededError
  useEffect(() => {
    if (isLoaded) {
      try {
        // Store only essential data: product ID and quantity
        const minimalCart = items.map(item => ({
          id: item.id,
          productId: item.product.id,
          quantity: item.quantity
        }));
        
        localStorage.setItem('cart', JSON.stringify(minimalCart));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Attempting to clear old data...');
          
          // Try to clear non-essential items from localStorage
          try {
            // Remove temporary/cache items if any
            const keysToTry = ['notifiedLowStockIds', 'notifiedSalesIds'];
            keysToTry.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                // ignore
              }
            });

            // Retry saving the cart
            const minimalCart = items.map(item => ({
              id: item.id,
              productId: item.product.id,
              quantity: item.quantity
            }));
            
            localStorage.setItem('cart', JSON.stringify(minimalCart));
          } catch (retryError) {
            console.error('Failed to save cart after cleanup:', retryError);
            alert('No se pudo guardar el carrito. El almacenamiento local está lleno. Por favor, borra algunos datos o usa el modo incógnito.');
          }
        } else {
          console.error('Error saving cart to localStorage:', error);
        }
      }
    }
  }, [items, isLoaded]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);

      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...currentItems, {
          id: Date.now(), // Simple ID generation
          product,
          quantity
        }];
      }
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalItems = useCallback(() => {
    if (!Array.isArray(items)) {
      console.warn('Cart items is not an array, returning 0');
      return 0;
    }
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    if (!Array.isArray(items)) {
      console.warn('Cart items is not an array, returning 0');
      return 0;
    }
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [items]);

  const value: CartContextType = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  }), [items, addItem, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
