'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingBag, AlertCircle, Mail, CreditCard, Package, ChevronRight, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartService } from '@/services/CartService';
import { purchaseService } from '@/services/PurchaseService';
import Link from 'next/link';

const KEY_VALUE_COP = 10;

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

export default function CheckoutPage() {
  const { cart, cartSummary, clearCart } = useCart();
  const [contactEmail, setContactEmail] = useState('');
  const [keysToUse, setKeysToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockValidation = CartService.validateStock(cart);

  const totalMaxKeysAllowed = useMemo(
    () => cart.reduce((sum, item) => sum + item.maxKeysAllowed * item.quantity, 0),
    [cart]
  );

  const totalMinCashCOP = useMemo(
    () => Math.ceil(cart.reduce((sum, item) => sum + item.minCashCents * item.quantity, 0) / 100),
    [cart]
  );

  const keysValueCOP = keysToUse * KEY_VALUE_COP;
  const cashToPayCOP = cartSummary.total - keysValueCOP;

  const handleKeysChange = (value: number) => {
    setKeysToUse(Math.max(0, Math.min(value, totalMaxKeysAllowed)));
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
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Carrito vacío ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#03548C]/10 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-9 h-9 text-[#03548C]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
          <p className="text-gray-500 mb-6">Agrega productos para continuar con la compra</p>
          <Link href="/products">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#03548C] hover:bg-[#0b1440] text-white font-semibold rounded-xl transition-colors">
              <Package className="w-4 h-4" />
              Explorar productos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <CreditCard className="w-3.5 h-3.5 text-[#FFD700]" />
            Pago seguro con Wompi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Finalizar compra</h1>
          <p className="text-white/70 text-sm sm:text-base">
            {cartSummary.itemCount} producto{cartSummary.itemCount !== 1 ? 's' : ''} · Total {formatCOP(cartSummary.total)}
          </p>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Columna principal ── */}
          <div className="md:col-span-2 space-y-5">

            {/* Errores de stock */}
            {!stockValidation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-1">
                  {stockValidation.errors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}

            {/* Error de submit */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Pagar con llaves */}
              {totalMaxKeysAllowed > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <img src="/logos/llave.png" alt="llave" className="w-5 h-5 object-contain" />
                    </div>
                    <h2 className="font-semibold text-white text-sm">Pagar con llaves</h2>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Llaves disponibles para esta compra</span>
                      <span className="font-bold text-[#03548C]">{totalMaxKeysAllowed.toLocaleString('es-CO')}</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={totalMaxKeysAllowed}
                      value={keysToUse}
                      onChange={(e) => handleKeysChange(Number(e.target.value))}
                      className="w-full accent-[#03548C]"
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={totalMaxKeysAllowed}
                        value={keysToUse}
                        onChange={(e) => handleKeysChange(Number(e.target.value))}
                        className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
                      />
                      <span className="text-sm text-gray-600">
                        llaves = <span className="font-semibold text-[#03548C]">{formatCOP(keysValueCOP)}</span>
                      </span>
                    </div>

                    {/* Desglose */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Descuento con llaves</span>
                        <span className="text-[#03548C] font-medium">−{formatCOP(keysValueCOP)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-700 font-medium">Pago con Wompi</span>
                        <span className="font-bold text-[#0b1440]">{formatCOP(cashToPayCOP)}</span>
                      </div>
                      {totalMinCashCOP > 0 && (
                        <p className="text-xs text-gray-400">
                          Mínimo en efectivo requerido: {formatCOP(totalMinCashCOP)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email de contacto */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-[#03548C]" />
                  <h2 className="font-semibold text-gray-800 text-sm">Email de entrega</h2>
                  <span className="text-xs text-gray-400">(opcional)</span>
                </div>

                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] transition"
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-gray-400">
                  Recibirás las credenciales de tus productos digitales en este correo.
                </p>

                <button
                  type="submit"
                  disabled={isProcessing || !stockValidation.isValid}
                  className="w-full py-3.5 bg-[#03548C] hover:bg-[#0b1440] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Pagar {formatCOP(cashToPayCOP)} con Wompi
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Resumen del pedido ── */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#03548C]" />
                <h2 className="font-bold text-gray-900 text-sm">Resumen del pedido</h2>
              </div>

              <div className="p-5 space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between gap-2 text-sm">
                    <span className="text-gray-600 truncate flex-1">
                      {item.name}
                      <span className="text-gray-400 ml-1">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 shrink-0">
                      {formatCOP(item.price * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCOP(cartSummary.total)}</span>
                  </div>
                  {keysToUse > 0 && (
                    <div className="flex justify-between text-sm text-[#03548C]">
                      <span>Llaves ({keysToUse.toLocaleString('es-CO')})</span>
                      <span className="font-medium">−{formatCOP(keysValueCOP)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                    <span className="text-gray-900">Total a pagar</span>
                    <span className="text-[#03548C]">{formatCOP(cashToPayCOP)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
