'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, AlertCircle, Key } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartService } from '@/services/CartService';
import { purchaseService } from '@/services/PurchaseService';

const KEY_VALUE_COP = 10; // 1 llave = $10 COP (= 1.000 centavos backend)

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSummary, clearCart } = useCart();
  const [contactEmail, setContactEmail] = useState('');
  const [keysToUse, setKeysToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockValidation = CartService.validateStock(cart);

  // Límite total de llaves sumando todos los ítems × cantidad
  const totalMaxKeysAllowed = useMemo(
    () => cart.reduce((sum, item) => sum + item.maxKeysAllowed * item.quantity, 0),
    [cart]
  );

  // Piso mínimo de efectivo en COP
  const totalMinCashCOP = useMemo(
    () => Math.ceil(cart.reduce((sum, item) => sum + item.minCashCents * item.quantity, 0) / 100),
    [cart]
  );

  const keysValueCOP = keysToUse * KEY_VALUE_COP;
  const cashToPayCOP = cartSummary.total - keysValueCOP;

  const handleKeysChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, totalMaxKeysAllowed));
    setKeysToUse(clamped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) { setError('El carrito está vacío'); return; }
    if (!stockValidation.isValid) { setError('Algunos productos no tienen stock suficiente.'); return; }

    setIsProcessing(true);
    try {
      const result = await purchaseService.createPurchase({
        items: CartService.convertToCreatePurchaseDTO(cart),
        keysToUse: keysToUse > 0 ? keysToUse : undefined,
        contactEmail: contactEmail || undefined,
      });

      clearCart();

      // Redirigir a Wompi (URL externa — NO usar router.push)
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 mt-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
          <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
          <button onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Explorar Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-4">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="md:col-span-2 space-y-6">
            {!stockValidation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <ul className="text-sm text-red-700 space-y-1">
                    {stockValidation.errors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección de llaves */}
              {totalMaxKeysAllowed > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-purple-600" />
                    <h2 className="font-semibold text-purple-900">Pagar con llaves</h2>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-purple-700">
                      <span>Llaves disponibles para esta compra</span>
                      <span className="font-bold">{totalMaxKeysAllowed.toLocaleString('es-CO')}</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={totalMaxKeysAllowed}
                      value={keysToUse}
                      onChange={(e) => handleKeysChange(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={totalMaxKeysAllowed}
                        value={keysToUse}
                        onChange={(e) => handleKeysChange(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                      />
                      <span className="text-sm text-purple-700">
                        llaves = {formatCOP(keysValueCOP)}
                      </span>
                    </div>
                  </div>

                  {/* Desglose del pago */}
                  <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con llaves ({keysToUse.toLocaleString('es-CO')} llaves)</span>
                      <span className="text-purple-700 font-medium">{formatCOP(keysValueCOP)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Con Wompi (dinero real)</span>
                      <span className="font-bold text-blue-700">{formatCOP(cashToPayCOP)}</span>
                    </div>
                    {totalMinCashCOP > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Mínimo en efectivo: {formatCOP(totalMinCashCOP)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de entrega (opcional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para recibir las credenciales de tus productos
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !stockValidation.isValid}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    `Pagar ${formatCOP(cashToPayCOP)} con Wompi`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Resumen */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Resumen</h2>

              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} ×{item.quantity}</span>
                    <span className="font-medium">{formatCOP(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">{formatCOP(cartSummary.total)}</span>
                </div>
                {keysToUse > 0 && (
                  <div className="flex justify-between text-sm text-purple-700">
                    <span>Con llaves</span>
                    <span>−{formatCOP(keysValueCOP)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>A pagar</span>
                  <span className="text-blue-600">{formatCOP(cashToPayCOP)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
