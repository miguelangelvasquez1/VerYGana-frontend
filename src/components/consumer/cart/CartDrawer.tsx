'use client';

// ========================================
// CART DRAWER - Panel Lateral del Carrito
// ========================================

import React, { useEffect, useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CartItem } from './CartItem';

const TRANSITION_MS = 220;

export function CartDrawer() {
  const router = useRouter();
  const { cart, cartSummary, isCartOpen, closeCart } = useCart();

  // Mantiene el drawer montado durante la animación de salida
  const [shouldRender, setShouldRender] = useState(isCartOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsVisible(false);
    const timeout = setTimeout(() => setShouldRender(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [isCartOpen]);

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

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-[220ms] ease-out will-change-transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
          <h2 className="text-lg font-bold">Carrito de Compras</h2>
          <button
            onClick={closeCart}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        {cart.length === 0 ? (
          // Carrito vacío
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-[#03548C]/30 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <button
              onClick={() => { closeCart(); router.push('/products'); }}
              className="px-6 py-2 bg-[#03548C] hover:bg-[#0b1440] text-white rounded-lg transition-colors cursor-pointer"
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
                  <span className="text-[#03548C]">${cartSummary.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Botón de checkout */}
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-[#03548C] hover:bg-[#0b1440] text-white font-semibold rounded-lg transition-colors"
              >
                Finalizar Compra
              </button>

              <button
                onClick={closeCart}
                className="w-full py-2 text-[#03548C] hover:text-[#0b1440] font-medium transition-colors"
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