'use client';

// ========================================
// BOTÓN DEL CARRITO (Para la Navbar)
// ========================================

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function CartButton() {
  const { cartSummary, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-white/20 hover:scale-105 transition-all rounded-md"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="w-6 h-6 white" />
      
      {/* Burbuja con cantidad */}
      {cartSummary.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in zoom-in-50">
          {cartSummary.itemCount > 99 ? '99+' : cartSummary.itemCount}
        </span>
      )}
    </button>
  );
}