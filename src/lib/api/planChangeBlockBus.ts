// Puente entre el interceptor de axios (que no puede renderizar UI) y el
// <PlanChangeBlockedModal/> montado en el layout del comercial.
//
// El backend responde HTTP 400 con un mensaje específico cuando el comercial
// intenta crear/activar un activo (anuncio, producto, encuesta, juego
// brandeado) teniendo una solicitud de cambio de plan EN CURSO. El preview y
// los CTA deshabilitados ya deberían evitar llegar aquí; esto cubre carreras
// (el usuario abrió el formulario en otra pestaña) y formularios ya abiertos.

type Listener = (message: string) => void;

const listeners = new Set<Listener>();

// Anti-spam: si varias requests fallan casi a la vez, abrimos el modal una vez.
let lastEmit = 0;
const THROTTLE_MS = 6000;

export const PLAN_CHANGE_BLOCK_DEFAULT_MESSAGE =
  'Tienes una solicitud de cambio de plan en curso. No puedes crear ni activar nuevos activos hasta que se resuelva o cancele la solicitud.';

// Detecta el error del backend sin acoplarnos a su redacción exacta.
export function isPlanChangeBlockMessage(message?: string | null): boolean {
  if (!message) return false;
  return /solicitud de cambio de plan en curso/i.test(message);
}

export function emitPlanChangeBlocked(message?: string | null): void {
  const now = Date.now();
  if (now - lastEmit < THROTTLE_MS) return;
  lastEmit = now;

  const text = message?.trim() ? message.trim() : PLAN_CHANGE_BLOCK_DEFAULT_MESSAGE;
  listeners.forEach((fn) => {
    try {
      fn(text);
    } catch {
      /* un listener que explota no debe frenar a los demás */
    }
  });
}

export function subscribePlanChangeBlocked(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
