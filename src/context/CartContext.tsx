'use client';

// ========================================
// CART CONTEXT - Estado Global del Carrito
// ========================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartSummary } from '@/types/cart.types';
import { CartService } from '@/services/CartService';

interface CartContextType {
  cart: CartItem[];
  cartSummary: CartSummary;
  isCartOpen: boolean;
  
  // Acciones
  addItem: (product: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    stock: number;
    categoryName: string;
  }, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cargar carrito del localStorage al montar
  useEffect(() => {
    const savedCart = CartService.getCart();
    setCart(savedCart);
  }, []);

  // Calcular resumen cada vez que cambie el carrito
  const cartSummary = CartService.getCartSummary(cart);

  // ====================================
  // ACCIONES
  // ====================================

  const addItem = (
    product: {
      id: number;
      name: string;
      imageUrl: string;
      price: number;
      stock: number;
      categoryName: string;
    },
    quantity: number = 1
  ) => {
    try {
      const newCart = CartService.addItem(cart, product, quantity);
      setCart(newCart);
    } catch (error) {
      // Aquí puedes mostrar un toast/notificación de error
      console.error('Error adding to cart:', error);
      throw error; // Re-lanzar para que el componente lo maneje
    }
  };

  const removeItem = (productId: number) => {
    const newCart = CartService.removeItem(cart, productId);
    setCart(newCart);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    try {
      const newCart = CartService.updateQuantity(cart, productId, quantity);
      setCart(newCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = () => {
    CartService.clearCart();
    setCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartSummary,
        isCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado para usar el carrito
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}