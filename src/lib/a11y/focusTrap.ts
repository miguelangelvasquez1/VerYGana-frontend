// Sin 'use client' para poder importarse desde las pruebas de Vitest.

// Elementos que reciben foco con el teclado dentro de un diálogo.
export const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Descarta los enfocables que no se ven (display: none o dentro de un ancestro `hidden`).
export function isTabbable(el: {
  getClientRects(): { length: number };
  closest(selector: string): unknown;
}): boolean {
  return el.getClientRects().length > 0 && !el.closest('[hidden]');
}

// A dónde mover el foco al pulsar Tab (o Mayús+Tab) para que no salga del diálogo.
// `index` es la posición del elemento enfocado entre los enfocables (-1 si es el panel o ninguno).
// Devuelve el índice destino, 'panel' si no hay enfocables, o `null` si el navegador puede seguir solo.
export function trappedFocusIndex(input: {
  index: number;
  count: number;
  shiftKey: boolean;
}): number | 'panel' | null {
  const { index, count, shiftKey } = input;
  if (count <= 0) return 'panel';
  const last = count - 1;
  // El foco salió del panel o está en el propio panel: vuelve adentro.
  if (index < 0 || index > last) return shiftKey ? last : 0;
  if (shiftKey && index === 0) return last;
  if (!shiftKey && index === last) return 0;
  return null;
}
