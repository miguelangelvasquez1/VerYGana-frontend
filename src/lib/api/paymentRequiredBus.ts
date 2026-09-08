// Puente entre el interceptor de axios (que no puede renderizar UI) y el
// <PaymentRequiredModal/> montado en el layout del comercial.
//
// Cuando el backend responde 402 (Payment Required) — saldo publicitario en
// $0 — el interceptor llama a `emitPaymentRequired(message)` y el modal
// global se abre con acción directa al checkout de recarga. Sin desloguear
// ni redirigir a una pantalla de error genérica.

type Listener = (message: string) => void;

const listeners = new Set<Listener>();

// Anti-spam: si varias requests fallan con 402 casi a la vez, solo abrimos
// el modal una vez.
let lastEmit = 0;
const THROTTLE_MS = 8000;

export const PAYMENT_REQUIRED_DEFAULT_MESSAGE =
  'Tu saldo publicitario se agotó. Recarga tu billetera para continuar.';

export function emitPaymentRequired(message?: string | null): void {
  const now = Date.now();
  if (now - lastEmit < THROTTLE_MS) return;
  lastEmit = now;

  const text = message?.trim() ? message.trim() : PAYMENT_REQUIRED_DEFAULT_MESSAGE;
  listeners.forEach((fn) => {
    try {
      fn(text);
    } catch {
      /* un listener que explota no debe frenar a los demás */
    }
  });
}

export function subscribePaymentRequired(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
