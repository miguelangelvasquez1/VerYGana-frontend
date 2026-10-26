import { test, type Page } from '@playwright/test';

// Mediciones que corren dentro del navegador (spec 012). Devuelven datos simples para que el mensaje de
// una prueba fallida diga qué elemento arreglar.

export const MIN_TOUCH_PX = 44;
const NETWORK_IDLE_MAX_MS = 5_000;

/**
 * Espera a que la página termine de pedir datos y de animarse lo básico. La espera de red está acotada: si
 * algo reintenta sin parar (por ejemplo el prefetch de un enlace a una ruta que no existe), la prueba sigue
 * y falla en su propia aserción, con un mensaje que dice qué se rompió, en vez de agotar el tiempo aquí.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MAX_MS }).catch(() => {
    // No es un fallo, pero la medición que sigue puede ver un estado de carga: queda anotado en el reporte.
    const message = `settle: la red no quedó inactiva en ${NETWORK_IDLE_MAX_MS} ms en ${page.url()}; la medición puede ser de un estado de carga`;
    console.warn(message);
    test.info().annotations.push({ type: 'warning', description: message });
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

export interface OverflowReport {
  viewport: number;
  documentWidth: number;
  bodyWidth: number;
  offenders: string[];
}

/** Ancho del documento contra el del viewport, y los elementos cuyo borde derecho se pasa. */
export async function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    // `innerWidth` no sirve en emulación móvil: Chromium lo ensancha para que quepa el contenido. El ancho
    // visible real es el de `clientWidth` del documento (el viewport de la prueba).
    const viewport = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
      return `${el.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ''} "${text}"`;
    };
    const insideFixed = (el: Element) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        if (getComputedStyle(node).position === 'fixed') return true;
      }
      return false;
    };
    // Los fijos siguen al viewport ensanchado y no son la causa: se ignoran. De los demás se reportan los que
    // se pasan aunque su padre no (el primer nivel del desborde), que es lo que hay que arreglar.
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.right <= viewport + 1) continue;
      if (insideFixed(el)) continue;
      const parent = el.parentElement?.getBoundingClientRect();
      if (parent && parent.right > viewport + 1 && el.parentElement !== document.body) continue;
      offenders.push(`${describe(el)} (derecha=${Math.round(rect.right)})`);
      if (offenders.length >= 8) break;
    }
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    };
  });
}

/** Cuenta botones dentro de enlaces y enlaces dentro de botones en el DOM (CA-4). */
export async function nestedInteractive(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selectors = ['a button', 'a [role="button"]', 'button a', 'button button', '[role="button"] a'];
    const found: string[] = [];
    for (const selector of selectors) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        found.push(`${selector}: ${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)}`);
      }
    }
    return found;
  });
}

/** Elementos interactivos visibles que miden menos de 44 × 44 (o su etiqueta, en checkbox y radio). */
export async function smallTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const selector = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const describe = (el: Element) => {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
      const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
      return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''} "${label}"`;
    };
    const isVisible = (el: Element) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      if (el.closest('[aria-hidden="true"]')) return false;
      return true;
    };

    const small: string[] = [];
    for (const el of Array.from(document.querySelectorAll(selector))) {
      if (!isVisible(el)) continue;
      let rect = el.getBoundingClientRect();
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        const label = el.labels?.[0] ?? el.closest('label');
        if (label) {
          const labelRect = label.getBoundingClientRect();
          if (labelRect.width * labelRect.height > rect.width * rect.height) rect = labelRect;
        }
      }
      if (rect.width < min - 0.5 || rect.height < min - 0.5) {
        small.push(`${describe(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    }
    return small;
  }, MIN_TOUCH_PX);
}
