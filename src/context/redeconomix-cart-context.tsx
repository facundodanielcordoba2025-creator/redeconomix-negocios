'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';

// Define the shape of a product in the cart
export interface CartProduct {
  id: string; // wholesale_products or retailer_inventory doc ID
  productId: string; // Master product ID or inventory doc ID
  name: string;
  price: number;
  wholesaler: string;
  wholesalerId: string;
  retailerId?: string;
  isRetailerProduct?: boolean;
  branchId?: string;
  imageUrl?: string;
  category?: string;
  code?: string;
  quantity: number;
}

export type ProductForCart = Omit<CartProduct, 'quantity'>;

// Define the context shape
interface CartContextType {
  cartItems: CartProduct[];
  addToCart: (product: ProductForCart, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  removeWholesalerItems: (wholesalerId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

// Create the context with a default undefined value
const RedEconomiXCartContext = createContext<CartContextType | undefined>(undefined);

// Define the props for the provider component
interface CartProviderProps {
  children: ReactNode;
}

// Create the provider component
export function RedEconomiXCartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Load from Preferences on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const { value } = await Preferences.get({ key: 'redeconomix_cart_v2' });
        if (value) {
          const parsed = JSON.parse(value);
          const today = new Date().toLocaleDateString('es-AR');
          
          // Política Anti-Desfalco: El carrito muere a las 00:00 (vence cada 24hs)
          if (parsed.date === today) {
             setCartItems(parsed.items || []);
          } else {
             // Si es de un día anterior, vaciarlo para forzar actualización de precios
             await Preferences.remove({ key: 'redeconomix_cart_v2' });
             setCartItems([]);
             console.log("🛒 Cart caducado: Limpieza de medianoche ejecutada.");
          }
        }
      } catch (e) {
        console.error("Cart hydration failed", e);
      }
      setIsLoaded(true);
    };
    loadCart();
  }, []);

  // Save to Preferences on change
  useEffect(() => {
    if (isLoaded) {
      const saveCart = async () => {
        try {
          const today = new Date().toLocaleDateString('es-AR');
          await Preferences.set({
            key: 'redeconomix_cart_v2',
            value: JSON.stringify({
              date: today,
              items: cartItems
            })
          });
        } catch (e) {
          console.error("Failed to save cart to Preferences:", e);
        }
      };
      saveCart();
    }
  }, [cartItems, isLoaded]);

  const addToCart = (product: ProductForCart, quantity?: number) => {
    const requestedQty = quantity ?? (product as any).quantity ?? 1;
    let finalQuantity = Math.max(1, Number(requestedQty) || 1);
    if (product.wholesalerId === 'inaki_oran' && finalQuantity < 5) {
       finalQuantity = 5;
    }
    const normalizedSellerId = product.wholesalerId || product.retailerId || 'unknown';
    const normalizedProduct: ProductForCart = {
      ...product,
      wholesalerId: normalizedSellerId,
      wholesaler: product.wholesaler || (product as any).wholesalerName || (product as any).businessName || 'Comercio Local',
      productId: product.isRetailerProduct ? product.id : (product.productId || product.id),
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === normalizedProduct.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === normalizedProduct.id ? { ...item, quantity: item.quantity + finalQuantity } : item
        );
      }
      return [...prevItems, { ...normalizedProduct, quantity: finalQuantity }];
    });
    toast({
      title: "Producto Agregado",
      description: `${product.name} ha sido agregado a tu pedido.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    toast({
        title: "Producto Eliminado",
        description: "El producto ha sido eliminado de tu carrito.",
        variant: "destructive",
    });
  };

  const removeWholesalerItems = (wholesalerId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.wholesalerId !== wholesalerId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    let finalQuantity = quantity;
    // Enforce Iñaki minimum even during updates in cart
    if (item.wholesalerId === 'inaki_oran' && quantity < 5 && quantity > 0) {
       finalQuantity = 5;
       toast({
           title: "Mínimo Requerido",
           description: "Este mayorista requiere un mínimo de 5 unidades.",
       });
    }

    if (finalQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: finalQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    removeWholesalerItems,
    updateQuantity,
    clearCart,
    itemCount,
    cartTotal,
  };

  return (
    <RedEconomiXCartContext.Provider value={value}>
      {children}
    </RedEconomiXCartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useRedEconomiXCart() {
  const context = useContext(RedEconomiXCartContext);
  if (context === undefined) {
    throw new Error('useRedEconomiXCart must be used within a RedEconomiXCartProvider');
  }
  return context;
}
