'use client';

// ========================================
// CHECKOUT PAGE - Página de Finalización de Compra
// ========================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartService } from '@/services/CartService';
import { CreatePurchaseRequestDTO } from '@/types/cart.types';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import { purchaseService } from '@/services/PurchaseService';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSummary, clearCart } = useCart();
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar stock antes de mostrar el checkout
  const stockValidation = CartService.validateStock(cart);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar carrito no vacío
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    // Validar stock nuevamente
    if (!stockValidation.isValid) {
      setError('Algunos productos no tienen stock suficiente. Por favor, ajusta las cantidades.');
      return;
    }

    setIsProcessing(true);

    try {
      // Construir el DTO de compra
      const purchaseRequest: CreatePurchaseRequestDTO = {
        items: CartService.convertToCreatePurchaseDTO(cart),
        contactEmail: contactEmail || undefined,
        notes: notes || undefined,
        couponCode: couponCode || undefined,
      };

      // Llamar a tu endpoint de compra
      const result = await purchaseService.createPurchase(purchaseRequest);

      clearCart();

      // Redirigir a página de confirmación
      router.push(`/purchases/${result.id}/confirmation`);
    } catch (err: any) {
      console.error('Error en checkout:', err);
      setError(err.message || 'Error al procesar la compra. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Si el carrito está vacío
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-500 mb-6">
            Agrega productos para continuar con tu compra
          </p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Explorar Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Finalizar Compra
          </h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="md:col-span-2 space-y-6">
              {/* Errores de validación */}
              {!stockValidation.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">
                        Problemas con el stock
                      </h3>
                      <ul className="text-sm text-red-700 space-y-1">
                        {stockValidation.errors.map((err, idx) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Error general */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contacto (opcional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para recibir las credenciales de tus productos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de cupón (opcional)
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="DESCUENTO10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instrucciones especiales..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !stockValidation.isValid}
                  className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    'Confirmar Compra'
                  )}
                </button>
              </form>
            </div>

            {/* Resumen */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Resumen de Compra
                </h2>

                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${cartSummary.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ${cartSummary.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}