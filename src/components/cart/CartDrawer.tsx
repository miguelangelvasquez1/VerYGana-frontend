'use client';

// ========================================
// CART DRAWER - Panel Lateral del Carrito
// ========================================

import React, { useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CartItem } from './CartItem';

export function CartDrawer() {
  const router = useRouter();
  const { cart, cartSummary, isCartOpen, closeCart } = useCart();

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };

    if (isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Carrito de Compras
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        {cart.length === 0 ? (
          // Carrito vacío
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <button
              onClick={closeCart}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Productos
            </button>
          </div>
        ) : (
          <>
            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>

            {/* Footer con total y botón */}
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Resumen */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Items ({cartSummary.itemCount})</span>
                  <span>${cartSummary.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${cartSummary.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Botón de checkout */}
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Finalizar Compra
              </button>

              <button
                onClick={closeCart}
                className="w-full py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}