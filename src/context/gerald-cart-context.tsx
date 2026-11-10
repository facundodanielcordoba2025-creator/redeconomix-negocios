'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GeraldCartItem {
    id: string; // Uniquely identifies this cart item (could be product.id + size)
    productId: string;
    name: string;
    price: string;
    image: string;
    size: string;
    quantity: number;
}

interface GeraldCartContextType {
    items: GeraldCartItem[];
    addItem: (item: Omit<GeraldCartItem, 'id' | 'quantity'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    discountAmount: number;
    total: number;
    discountPercentage: number;
    isCheckoutOpen: boolean;
    setIsCheckoutOpen: (open: boolean) => void;
}

const GeraldCartContext = createContext<GeraldCartContextType | undefined>(undefined);

export function GeraldCartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<GeraldCartItem[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('gerald_cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error parsing gerald cart", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('gerald_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (newItem: Omit<GeraldCartItem, 'id' | 'quantity'>) => {
        setItems(prev => {
            const id = `${newItem.productId}-${newItem.size}`;
            const existing = prev.find(i => i.id === id);
            if (existing) {
                return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...newItem, id, quantity: 1 }];
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return;
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const parsePrice = (priceStr: string) => {
        if (!priceStr) return 0;
        return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
    };

    const subtotal = items.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);

    let discountPercentage = 0;
    if (totalItems >= 3) {
        discountPercentage = 25;
    } else if (totalItems === 2) {
        discountPercentage = 15;
    }

    const discountAmount = Math.round(subtotal * (discountPercentage / 100));
    const total = subtotal - discountAmount;

    return (
        <GeraldCartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalItems,
            subtotal,
            discountAmount,
            total,
            discountPercentage,
            isCheckoutOpen,
            setIsCheckoutOpen
        }}>
            {children}
        </GeraldCartContext.Provider>
    );
}

export function useGeraldCart() {
    const context = useContext(GeraldCartContext);
    if (context === undefined) {
        throw new Error('useGeraldCart must be used within a GeraldCartProvider');
    }
    return context;
}
