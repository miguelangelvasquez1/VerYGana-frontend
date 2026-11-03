import { test, type Locator, type Page } from '@playwright/test';

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

/** Elementos interactivos visibles que miden menos de 44 × 44 (o su etiqueta, en checkbox y radio). Con `scope`, solo los de ese elemento. */
export async function smallTouchTargets(page: Page, scope?: Locator): Promise<string[]> {
  const root = scope ? await scope.elementHandle() : null;
  return page.evaluate(({ min, root }) => {
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
    for (const el of Array.from((root ?? document).querySelectorAll(selector))) {
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
  }, { min: MIN_TOUCH_PX, root });
}

// ── Mediciones de la spec 014 (paneles) ─────────────────────────────────────────────────────────────────────

/**
 * Lo que `measureOverflow` no ve (plan 2.6): en admin y cumplimiento el layout es `h-screen overflow-hidden` y
 * lo que no cabe queda recortado sin ensanchar el documento. Marca los elementos con contenido (texto, enlace,
 * botón, campo, imagen) cuyo borde se sale del viewport, salvo:
 * - los que están dentro de un contenedor que hace scroll horizontal a propósito (`overflow-x-auto`, `table-scroll`; la tabla con su scroll, RN-4) y cabe en la pantalla;
 * - los que están dentro de un elemento `fixed` que queda entero fuera de la pantalla (el cajón cerrado);
 * - los que están en un `aria-hidden` o sin caja.
 * Además marca el texto cortado con puntos suspensivos (`truncate`) salvo que el texto completo esté en
 * `title` o `aria-label` (D-10: es la única excepción admitida; cualquier otra se trae al usuario).
 */
export async function measureClipped(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
      return `${el.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ''} "${text}"`;
    };
    const norm = (value: string | null | undefined) => (value ?? '').trim().replace(/\s+/g, ' ');
    const CONTENT_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'LABEL']);
    const hasOwnText = (el: Element) =>
      Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '');

    // Un contenedor que hace scroll horizontal a propósito: lo dice su clase (`overflow-x-auto`, `table-scroll`...)
    // (con o sin `max-lg:`: el estilo calculado dice si aplica a este ancho) y su borde cabe en la pantalla. Mirar solo el estilo calculado no sirve: `overflow-y-auto` vuelve `auto`
    // el `overflow-x` calculado de cualquier contenedor de página y taparía justo el recorte que se busca.
    const SCROLL_CLASS = /^(max-lg:)?(overflow-x-(auto|scroll)|overflow-(auto|scroll)|table-scroll)$/;
    const scrollsHorizontally = (el: Element) => {
      const ox = getComputedStyle(el).overflowX;
      if (ox !== 'auto' && ox !== 'scroll') return false;
      if (!Array.from(el.classList).some((c) => SCROLL_CLASS.test(c))) return false;
      return el.getBoundingClientRect().right <= viewport + 1;
    };
    const exempt = (el: Element) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        if (node.getAttribute('aria-hidden') === 'true') return true;
        const style = getComputedStyle(node);
        if (style.visibility === 'hidden' || style.display === 'none') return true;
        if (node !== el && scrollsHorizontally(node)) return true;
        if (style.position === 'fixed') {
          const box = node.getBoundingClientRect();
          if (box.left >= viewport - 1 || box.right <= 1) return true;
        }
      }
      return false;
    };

    const found: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (found.length >= 8) break;
      if (!(CONTENT_TAGS.has(el.tagName) || hasOwnText(el))) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > viewport + 1 || rect.left < -1) {
        if (!exempt(el)) found.push(`${describe(el)} se sale de la pantalla (izquierda=${Math.round(rect.left)}, derecha=${Math.round(rect.right)})`);
        continue;
      }
      // Texto cortado con puntos suspensivos.
      const style = getComputedStyle(el);
      if (style.textOverflow === 'ellipsis' && style.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1) {
        const full = norm(el.textContent);
        let accessible = false;
        for (let node: Element | null = el; node && !accessible; node = node.parentElement) {
          const label = norm(node.getAttribute('title')) || norm(node.getAttribute('aria-label'));
          accessible = label !== '' && label.includes(full);
        }
        if (!accessible && !exempt(el)) found.push(`${describe(el)} texto cortado sin el texto completo en title o aria-label`);
      }
    }
    return found;
  });
}

/**
 * RN-4 y CA-8: una tabla más ancha que su contenedor (o que se sale de la pantalla) vive dentro de un ancestro
 * con la clase `table-scroll` y `overflow-x: auto | scroll`, y ese contenedor cabe en la pantalla. Devuelve los
 * problemas, uno por tabla.
 */
export async function measureTables(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const heading = (table: Element) => {
      const th = Array.from(table.querySelectorAll('th')).slice(0, 3).map((h) => (h.textContent ?? '').trim());
      return th.length ? th.join(' | ') : 'sin encabezados';
    };
    const problems: string[] = [];
    for (const table of Array.from(document.querySelectorAll('table'))) {
      const rect = table.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const parent = table.parentElement;
      const overflows = rect.right > viewport + 1 || (parent !== null && rect.width > parent.clientWidth + 1);
      if (!overflows) continue;
      let wrapper: Element | null = null;
      for (let node = table.parentElement; node; node = node.parentElement) {
        const ox = getComputedStyle(node).overflowX;
        if (node.classList.contains('table-scroll') && (ox === 'auto' || ox === 'scroll')) {
          wrapper = node;
          break;
        }
      }
      if (!wrapper) {
        problems.push(`tabla (${heading(table)}) más ancha que su contenedor y sin un contenedor .table-scroll con overflow-x`);
      } else if (wrapper.getBoundingClientRect().right > viewport + 1) {
        problems.push(`tabla (${heading(table)}): su .table-scroll se sale de la pantalla (derecha=${Math.round(wrapper.getBoundingClientRect().right)})`);
      }
    }
    return problems;
  });
}

export interface ModalReport {
  problems: string[];
  small: string[];
}

/**
 * CA-9: la caja del diálogo cabe en la pantalla (izquierda ≥ 0, derecha ≤ ancho, alto ≤ alto del viewport), el
 * botón de cerrar (por nombre accesible) está dentro del viewport sin desplazar nada y mide 44 px, y si el
 * contenido es más alto que la caja, algún descendiente (o ella misma) tiene `overflow-y: auto | scroll` con
 * `scrollHeight > clientHeight`. Más las áreas táctiles dentro del diálogo.
 */
export async function measureModal(page: Page, dialog: Locator, closeName: string | RegExp): Promise<ModalReport> {
  const problems: string[] = [];
  const box = await dialog.boundingBox();
  // El tamaño del viewport de la prueba: `innerHeight` en emulación móvil sigue al contenido y no sirve.
  const size = page.viewportSize();
  const viewport = size
    ? { w: size.width, h: size.height }
    : await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: window.innerHeight }));
  if (!box) {
    problems.push('el diálogo no tiene caja');
  } else {
    if (box.x < -0.5) problems.push(`el diálogo se sale por la izquierda (${Math.round(box.x)})`);
    if (box.x + box.width > viewport.w + 0.5) problems.push(`el diálogo se sale por la derecha (${Math.round(box.x + box.width)} de ${viewport.w})`);
    if (box.height > viewport.h + 0.5) problems.push(`el diálogo es más alto que la pantalla (${Math.round(box.height)} de ${viewport.h})`);
  }

  const close = dialog.getByRole('button', { name: closeName }).first();
  const closeBox = (await close.count()) > 0 ? await close.boundingBox() : null;
  if (!closeBox) {
    problems.push(`no hay un botón de cerrar "${String(closeName)}" visible`);
  } else {
    if (closeBox.y < -0.5 || closeBox.y + closeBox.height > viewport.h + 0.5 || closeBox.x < -0.5 || closeBox.x + closeBox.width > viewport.w + 0.5) {
      problems.push('el botón de cerrar queda fuera de la pantalla sin desplazar nada');
    }
    if (closeBox.width < MIN_TOUCH_PX - 0.5 || closeBox.height < MIN_TOUCH_PX - 0.5) {
      problems.push(`el botón de cerrar mide ${Math.round(closeBox.width)}x${Math.round(closeBox.height)} (mínimo 44)`);
    }
  }

  const scroll = await dialog.evaluate((el) => {
    const nodes = [el, ...Array.from(el.querySelectorAll('*'))];
    const tallest = nodes.reduce((max, n) => Math.max(max, n.scrollHeight), 0);
    const scrollers = nodes.filter((n) => {
      const oy = getComputedStyle(n).overflowY;
      return (oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1;
    });
    return { overflowsBox: tallest > el.clientHeight + 1 && getComputedStyle(el).overflowY === 'visible', scrollers: scrollers.length };
  });
  if (scroll.overflowsBox && scroll.scrollers === 0) {
    problems.push('el contenido es más alto que el diálogo y nada hace scroll dentro de él');
  }

  // RN-5: si algo hace scroll dentro del diálogo, el botón de cerrar sigue a la vista y tocable después de bajar.
  if (closeBox && scroll.scrollers > 0 && typeof closeName === 'string') {
    const problem = await closeStaysVisibleAfterScroll(dialog, closeName);
    if (problem) problems.push(problem);
  }

  return { problems, small: await smallTouchTargets(page, dialog) };
}

/**
 * RN-5: baja hasta el final todo lo que hace scroll dentro del diálogo y comprueba que el botón de cerrar (nombre
 * exacto, por `aria-label` o texto) sigue a la vista y tocable: el encabezado debe quedar fijo arriba y el cuerpo
 * desplazarse debajo, no el botón con él. Devuelve el problema, o `null` si no hay nada que desplazar, no hay un
 * botón con ese nombre exacto o el botón se mantiene a la vista.
 */
export async function closeStaysVisibleAfterScroll(dialog: Locator, closeName: string): Promise<string | null> {
  const stillVisible = await dialog.evaluate((el, name) => {
    const scrollers = [el, ...Array.from(el.querySelectorAll('*'))].filter((n) => {
      const oy = getComputedStyle(n).overflowY;
      return (oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1;
    });
    if (scrollers.length === 0) return true;
    for (const n of scrollers) n.scrollTop = n.scrollHeight;
    const button = Array.from(el.querySelectorAll('button')).find(
      (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name,
    );
    let result = true; // sin coincidencia exacta no se puede medir: no se marca
    if (button) {
      const r = button.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      result = r.y >= -0.5 && r.y + r.height <= vh + 0.5 && top !== null && button.contains(top);
    }
    for (const n of scrollers) n.scrollTop = 0;
    return result;
  }, closeName);
  return stillVisible ? null : 'el botón de cerrar se va con el scroll del modal (el encabezado debe quedar fijo arriba)';
}

/**
 * Marca como `data-e2e-dialog` el diálogo abierto: el `[role="dialog"]` visible, o la capa `fixed` que cubre la
 * pantalla con la caja visible más grande que no sea el fondo. Devuelve el localizador. Los modales del repo no
 * usan `role="dialog"` de forma uniforme, de ahí la heurística.
 */
export async function findOpenDialog(page: Page): Promise<Locator> {
  await page.evaluate(() => {
    document.querySelectorAll('[data-e2e-dialog]').forEach((n) => n.removeAttribute('data-e2e-dialog'));
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    // Un cajón de menú cerrado es `inert` y queda fuera de pantalla: no es un diálogo abierto.
    const roleDialog = Array.from(document.querySelectorAll('[role="dialog"]'))
      .filter((el) => visible(el) && !el.closest('[inert]'))
      .pop();
    if (roleDialog) {
      roleDialog.setAttribute('data-e2e-dialog', '');
      return;
    }
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const overlays = Array.from(document.body.querySelectorAll('*')).filter((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.position === 'fixed' && visible(el) && r.width >= vw - 1 && r.height >= vh - 1 && el.children.length > 0;
    });
    const overlay = overlays.pop();
    if (!overlay) return;
    let best: Element = overlay;
    let bestArea = 0;
    for (const el of Array.from(overlay.querySelectorAll('*'))) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      const backdrop = r.width >= vw - 1 && r.height >= vh - 1;
      // Área visible: el contenido de un modal con scroll es más alto que el diálogo, pero solo se ve la parte
      // que cabe en la pantalla; con el área completa ganaría el contenido y no la caja del diálogo.
      const area = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (!backdrop && area > bestArea && el.children.length > 0) {
        best = el;
        bestArea = area;
      }
    }
    best.setAttribute('data-e2e-dialog', '');
  });
  return page.locator('[data-e2e-dialog]').first();
}

/**
 * CA-6, `hover` en el DOM: botones o enlaces dentro de una fila de tabla o de una tarjeta (`.group`) que están
 * invisibles (`opacity: 0` propia o heredada) y solo aparecerían con el ratón. En el celular no hay ratón.
 */
export async function hoverOnlyActions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    const opacityOf = (el: Element) => {
      let o = 1;
      for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      return o;
    };
    for (const el of Array.from(document.querySelectorAll('tr button, tr a[href], .group button, .group a[href]'))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.pointerEvents === 'none') continue;
      if (opacityOf(el) < 0.05 || style.visibility === 'hidden') {
        const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
        found.push(`${el.tagName.toLowerCase()} "${label}" invisible sin el ratón`);
        if (found.length >= 8) break;
      }
    }
    return found;
  });
}

export interface DesktopHeaderReport {
  viewport: number;
  navWidth: number;
  logo: number;
  items: number;
  actions: number;
  /** Suma de los tres grupos con el relleno lateral (48) y un respiro de 16 px entre grupos (spec 016, plan 3.10). */
  intrinsic: number;
  crossings: string[];
  outside: string[];
  clipped: string[];
  modes: { label: string; mode: 'icon' | 'text'; ariaLabel: string | null; title: string | null }[];
}

/**
 * Header de escritorio (spec 016, CA-7, RN-5): cajas del logo, de los accesos y de las acciones; pares que se
 * cruzan; elementos fuera del `nav`; textos cortados o partidos en dos líneas; y el modo (ícono o texto) de cada
 * acceso. Mide solo las cajas de flujo: los menús desplegables son absolutos y no cuentan.
 */
export async function measureDesktopHeader(page: Page): Promise<DesktopHeaderReport> {
  return page.evaluate(() => {
    const nav = document.querySelector('nav.lg\\:block') as HTMLElement;
    const row = nav.firstElementChild as HTMLElement;
    const [logoEl, itemsEl, actionsEl] = Array.from(row.children) as HTMLElement[];
    const rect = (el: Element) => el.getBoundingClientRect();
    const navRect = rect(nav);
    const boxes: { name: string; el: HTMLElement }[] = [{ name: 'logo', el: logoEl }];
    Array.from(itemsEl.children).forEach((a) => boxes.push({ name: `acceso "${(a as HTMLElement).title}"`, el: a as HTMLElement }));
    const actionNames = ['llaves', 'carrito', 'campana', 'perfil'];
    // Las llaves llevan `order-first`: se nombran por contenido, no por posición.
    Array.from(actionsEl.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const name = el.textContent?.includes('Llaves disponibles') ? 'llaves' : (actionNames[i] ?? `acción ${i}`);
      boxes.push({ name: `acción ${name}`, el });
    });
    const crossings: string[] = [];
    const outside: string[] = [];
    const visible = boxes.filter((b) => rect(b.el).width > 0);
    for (let i = 0; i < visible.length; i++) {
      const a = rect(visible[i].el);
      if (a.left < navRect.left - 0.5 || a.right > navRect.right + 0.5) {
        outside.push(`${visible[i].name} [${Math.round(a.left)}, ${Math.round(a.right)}] fuera de [0, ${Math.round(navRect.right)}]`);
      }
      for (let j = i + 1; j < visible.length; j++) {
        const b = rect(visible[j].el);
        const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        if (overlap > 0.5) crossings.push(`${visible[i].name} y ${visible[j].name} se cruzan ${Math.round(overlap)} px`);
      }
    }
    // Textos: hojas con texto dentro de la barra, sin los menús desplegables (ocultos con opacidad 0).
    const clipped: string[] = [];
    const walker = document.createTreeWalker(nav, NodeFilter.SHOW_ELEMENT);
    for (let node = walker.nextNode() as HTMLElement | null; node; node = walker.nextNode() as HTMLElement | null) {
      if (node.closest('[class*="pointer-events-none"]') || node.closest('.absolute')) continue;
      // Texto solo para lectores (`sr-only` aplicado, como el nombre del perfil de 1024 a 1279 px): no se ve, no se mide.
      let visuallyHidden = false;
      for (let up: HTMLElement | null = node; up && up !== nav; up = up.parentElement) {
        if (getComputedStyle(up).clipPath === 'inset(50%)') { visuallyHidden = true; break; }
      }
      if (visuallyHidden) continue;
      const r = rect(node);
      if (r.width === 0 || r.height === 0) continue;
      const ownText = Array.from(node.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!ownText) continue;
      const text = node.textContent!.trim().slice(0, 30);
      if (node.scrollWidth > node.clientWidth + 1) clipped.push(`"${text}" recortado (${node.scrollWidth} > ${node.clientWidth})`);
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = new Set(Array.from(range.getClientRects()).map((q) => Math.round(q.top))).size;
      if (lines > 1) clipped.push(`"${text}" se parte en ${lines} líneas`);
    }
    const modes = Array.from(itemsEl.children).map((a) => {
      const link = a as HTMLElement;
      const span = link.querySelector('span') as HTMLElement;
      const mode: 'icon' | 'text' = getComputedStyle(span).display === 'none' ? 'icon' : 'text';
      return { label: span.textContent ?? '', mode, ariaLabel: link.getAttribute('aria-label'), title: link.getAttribute('title') };
    });
    const logo = rect(logoEl).width;
    const items = rect(itemsEl).width;
    const actions = rect(actionsEl).width;
    return {
      viewport: document.documentElement.clientWidth,
      navWidth: navRect.width,
      logo,
      items,
      actions,
      intrinsic: logo + items + actions + 48 + 32,
      crossings,
      outside,
      clipped,
      modes,
    };
  });
}
