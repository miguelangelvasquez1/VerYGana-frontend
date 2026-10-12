'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, AlertCircle, Mail, CreditCard, Package, ChevronRight, Loader2, Info, RefreshCw, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { CartService } from '@/services/CartService';
import { purchaseService } from '@/services/PurchaseService';
import { keyPromotionKeys, usePurchaseQuote } from '@/hooks/keys/useKeyPromotions';
import { formatColombiaDateTime, formatCopCents, formatKeys, parseKeysError } from '@/utils/keys';
import Link from 'next/link';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

export default function CheckoutPage() {
  const { cart, cartSummary, clearCart } = useCart();
  const queryClient = useQueryClient();
  const [contactEmail, setContactEmail] = useState('');
  // Llaves elegidas en el selector. null = el usuario aún no ha visto una
  // cotización; con la primera se sugiere el máximo utilizable.
  const [selectedKeys, setSelectedKeys] = useState<number | null>(null);
  const [keysNotice, setKeysNotice] = useState<string | null>(null);
  const [keysInputError, setKeysInputError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const stockValidation = CartService.validateStock(cart);

  const items = useMemo(() => CartService.convertToCreatePurchaseDTO(cart), [cart]);

  const {
    data: quote,
    isFetching: quoteFetching,
    isPlaceholderData,
    isError: quoteFailed,
    error: quoteError,
    refetch: refetchQuote,
  } = usePurchaseQuote(items);

  // Solo se cotiza al entrar y cuando cambia el carrito; con cada cotización
  // nueva el selector se ajusta al máximo que el backend permite.
  useEffect(() => {
    if (!quote || isPlaceholderData) return;
    if (selectedKeys === null) {
      // Primera carga: el máximo es solo una sugerencia que el usuario ve y puede cambiar.
      setSelectedKeys(quote.usableKeys);
      return;
    }
    if (selectedKeys > quote.usableKeys) {
      setSelectedKeys(quote.usableKeys);
      setKeysNotice(
        `Ajustamos tu selección a ${formatKeys(quote.usableKeys)}: es lo máximo que puedes usar en esta compra.`
      );
    }
  }, [quote, isPlaceholderData]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxSelectableKeys = quote ? Math.max(0, quote.usableKeys) : 0;

  // Todo lo que depende de las llaves elegidas se calcula aquí, con enteros.
  const appliedKeys = Math.min(selectedKeys ?? maxSelectableKeys, maxSelectableKeys);
  const cashToPayCents = quote ? quote.totalCents - appliedKeys * quote.keyValueCents : 0;
  const cashToPayAtMaxCoverageCents = quote ? quote.totalCents - quote.maxApplicableKeys * quote.keyValueCents : 0;
  const missingKeysForMaxCoverage = quote ? Math.max(0, quote.maxApplicableKeys - quote.availableKeys) : 0;

  // La cotización en pantalla corresponde al carrito actual.
  const quoteReady = !!quote && !quoteFailed && !quoteFetching && !isPlaceholderData;

  const quoteItemsById = useMemo(
    () => new Map((quote?.items ?? []).map((item) => [item.productId, item])),
    [quote]
  );

  // Sin llaves utilizables el selector se muestra, pero bloqueado en 0.
  const keysLocked = isProcessing || maxSelectableKeys === 0;

  const handleKeysChange = (value: number) => {
    const requested = Math.floor(value) || 0;
    setKeysNotice(null);
    // Se recorta al rango permitido y se explica por qué.
    if (requested > maxSelectableKeys && quote) {
      setKeysInputError(
        !quote.backingSufficient
          ? `Por ahora solo puedes usar hasta ${formatKeys(quote.usableKeys)} en esta compra.`
          : quote.availableKeys < quote.maxApplicableKeys
            ? `Solo tienes ${formatKeys(quote.availableKeys)} disponibles.`
            : `El tope para esta compra es de ${formatKeys(quote.maxApplicableKeys)}.`
      );
    } else if (requested < 0) {
      setKeysInputError('La cantidad de llaves no puede ser negativa.');
    } else {
      setKeysInputError(null);
    }
    setSelectedKeys(Math.max(0, Math.min(requested, maxSelectableKeys)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorStatus(null);
    if (cart.length === 0) { setError('El carrito está vacío'); return; }
    if (!stockValidation.isValid) { setError('Algunos productos no tienen stock suficiente.'); return; }
    if (!quoteReady) return;
    setIsProcessing(true);
    try {
      const result = await purchaseService.createPurchase({
        items,
        keysToUse: appliedKeys,
        contactEmail: contactEmail || undefined,
      });
      clearCart();
      window.location.href = result.checkoutUrl;
    } catch (err) {
      const { status, message } = parseKeysError(err);
      setError(message);
      setErrorStatus(status);
      // 400 (llaves de más o insuficientes), 409 (respaldo) y 422 (la promoción
      // cambió): el backend no recorta, así que se recotiza para mostrar el tope vigente.
      if (status === 400 || status === 409 || status === 422) {
        if (status === 422) queryClient.invalidateQueries({ queryKey: keyPromotionKeys.active });
        setKeysNotice('Actualizamos la cotización. Revisa cuántas llaves puedes usar antes de pagar.');
        refetchQuote();
      }
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
            <button className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#03548C] hover:bg-[#0b1440] text-white font-semibold rounded-xl transition-colors">
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
            Pago seguro
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Finalizar compra</h1>
          <p className="text-white/70 text-sm sm:text-base">
            {cartSummary.itemCount} producto{cartSummary.itemCount !== 1 ? 's' : ''} · Total {quote ? formatCopCents(quote.totalCents) : formatCOP(cartSummary.total)}
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
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Columna principal ── */}
          <div className="lg:col-span-3 space-y-5">

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
                <div className="text-sm text-red-700 space-y-2">
                  <p>{error}</p>
                  {errorStatus === 409 && appliedKeys > 0 && (
                    <div className="space-y-2">
                      <p className="text-red-600">Puedes reintentar con menos llaves o pagar todo en dinero.</p>
                      <button
                        type="button"
                        onClick={() => { setError(null); setErrorStatus(null); handleKeysChange(0); }}
                        className="cursor-pointer px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-700 font-semibold hover:bg-red-100 transition-colors"
                      >
                        Pagar todo en dinero
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Pagar con llaves */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <img src="/logos/llave.png" alt="llave" className="w-5 h-5 object-contain" />
                  </div>
                  <h2 className="font-semibold text-white text-sm">Pagar con llaves</h2>
                  {quoteFetching && <Loader2 className="ml-auto w-4 h-4 text-white/70 animate-spin" />}
                </div>

                {quoteFailed ? (
                  <div className="p-5 space-y-3">
                    <div className="flex gap-3 text-sm text-red-700">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p>{parseKeysError(quoteError).message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchQuote()}
                      className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold text-[#03548C] hover:underline"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Volver a cotizar
                    </button>
                  </div>
                ) : !quote ? (
                  <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculando tu cotización...
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tus llaves disponibles</span>
                        <span className="font-bold text-[#03548C]">{formatKeys(quote.availableKeys)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tope de llaves para esta compra</span>
                        <span className="font-bold text-[#03548C]">{formatKeys(quote.maxApplicableKeys)}</span>
                      </div>
                    </div>

                    {/* El selector siempre está visible: usar llaves es opcional (de 0 al máximo). */}
                    <div className="space-y-3">
                        <label htmlFor="keys-to-use" className="block text-sm font-medium text-gray-700">
                          ¿Cuántas llaves quieres usar?
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(maxSelectableKeys, 1)}
                          value={appliedKeys}
                          onChange={(e) => handleKeysChange(Number(e.target.value))}
                          disabled={keysLocked}
                          aria-label="Llaves a usar"
                          className="w-full accent-[#03548C] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id="keys-to-use"
                            type="number"
                            min={0}
                            max={maxSelectableKeys}
                            value={appliedKeys || ''}
                            placeholder="0"
                            onChange={(e) => handleKeysChange(Number(e.target.value) || 0)}
                            disabled={keysLocked}
                            className={`w-28 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              keysInputError ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#03548C]'
                            }`}
                          />
                          <span className="text-xs text-gray-400">
                            de 0 a {maxSelectableKeys.toLocaleString('es-CO')}
                          </span>
                          <div className="ml-auto flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleKeysChange(0)}
                              disabled={keysLocked || appliedKeys === 0}
                              className="cursor-pointer px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Sin llaves
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKeysChange(maxSelectableKeys)}
                              disabled={keysLocked || appliedKeys === maxSelectableKeys}
                              className="cursor-pointer px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Máximo
                            </button>
                          </div>
                        </div>
                        {keysInputError && <p className="text-xs text-red-600">{keysInputError}</p>}
                        {maxSelectableKeys === 0 && (
                          <p className="text-sm text-gray-500">
                            {quote.availableKeys === 0
                              ? 'Aún no tienes llaves disponibles: esta compra se paga completa en dinero.'
                              : 'Esta compra no admite pago con llaves.'}
                          </p>
                        )}
                    </div>

                    {keysNotice && (
                      <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#03548C]" />
                        <p>{keysNotice}</p>
                      </div>
                    )}

                    {!quote.backingSufficient && (
                      <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                        <p>Por ahora solo puedes usar hasta {formatKeys(quote.usableKeys)} en esta compra.</p>
                      </div>
                    )}

                    {/* Desglose de la cotización */}
                    <div className={`bg-gray-50 rounded-xl p-4 space-y-2 text-sm transition-opacity ${quoteReady ? '' : 'opacity-60'}`}>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio total</span>
                        <span className="font-medium text-gray-700">{formatCopCents(quote.totalCents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Llaves aplicadas</span>
                        <span className="text-[#03548C] font-medium">{formatKeys(appliedKeys)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-700 font-medium">Dinero a pagar ahora</span>
                        <span className="font-bold text-[#0b1440]">{formatCopCents(cashToPayCents)}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-2 space-y-1 text-xs text-gray-500">
                        {missingKeysForMaxCoverage > 0 && (
                          <div className="flex justify-between gap-3">
                            <span>Llaves que te faltan para la cobertura máxima</span>
                            <span className="font-semibold text-gray-700 shrink-0">{formatKeys(missingKeysForMaxCoverage)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-3">
                          <span>Dinero a pagar con la cobertura máxima</span>
                          <span className="font-semibold text-gray-700 shrink-0">{formatCopCents(cashToPayAtMaxCoverageCents)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Email de contacto */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-[#03548C]" />
                  <h2 className="font-semibold text-gray-800 text-sm">Agregar un email de entrega diferente</h2>
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
                  disabled={isProcessing || !stockValidation.isValid || !quoteReady}
                  className="cursor-pointer w-full py-3.5 bg-[#03548C] hover:bg-[#0b1440] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    quoteReady && quote ? (
                      <>
                        Pagar {formatCopCents(cashToPayCents)}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : quoteFailed ? (
                      'Cotización no disponible'
                    ) : (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Actualizando cotización...
                      </>
                    )
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Resumen del pedido ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">

              {/* Header */}
              <div className="px-5 py-4 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-white" />
                <h2 className="font-bold text-white text-sm">Resumen del pedido</h2>
                <span className="ml-auto text-[#00a4ff] text-xs font-semibold">
                  {cartSummary.itemCount} producto{cartSummary.itemCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Productos */}
              <div className="divide-y divide-gray-50">
                {cart.map((item) => {
                  const quoteItem = quoteItemsById.get(item.productId);
                  return (
                  <div key={item.productId} className="flex gap-3 p-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{item.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-400">
                          {formatCOP(item.price)} × {item.quantity}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCOP(item.price * item.quantity)}
                        </span>
                      </div>
                      {quoteItem && (
                        <div className="mt-1.5 space-y-1">
                          {quoteItem.promotionEndsAt !== null ? (
                            <span className="inline-flex items-start gap-1 rounded-xl bg-orange-100 px-2 py-0.5 text-[11px] font-semibold leading-snug text-orange-700">
                              <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                              Hasta {quoteItem.maxKeysPct} % con Llaves · válida hasta {formatColombiaDateTime(quoteItem.promotionEndsAt)}
                            </span>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Hasta {quoteItem.maxKeysPct} % con Llaves
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Totales */}
              <div className="px-5 py-4 bg-gray-50 space-y-2.5 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Precio total</span>
                  <span className="font-medium text-gray-700">
                    {quote ? formatCopCents(quote.totalCents) : formatCOP(cartSummary.total)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#03548C]">Llaves aplicadas</span>
                  <span className="font-semibold text-[#03548C]">{quote ? formatKeys(appliedKeys) : '—'}</span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">Dinero a pagar</span>
                  <span className={`text-lg font-extrabold text-[#03548C] transition-opacity ${quoteReady ? '' : 'opacity-60'}`}>
                    {quote ? formatCopCents(cashToPayCents) : '—'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
