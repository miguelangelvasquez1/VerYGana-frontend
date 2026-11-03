import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { COMMERCIAL_ID } from './support/pages';
import { gotoPanelPage } from './support/panelOpen';
import { PANEL_PAGES, type PanelPage, type PanelVariant } from './support/panelPages';
import { signIn, type TestRole } from './support/session';

// Capturas de escritorio de referencia (spec 012, CA-8 y D-4): las páginas que usan componentes
// compartidos con otros roles, a 1280 × 800. Se generan sobre el código sin cambios y después de tocar los
// compartidos se comparan. Dependen del sistema operativo: solo corren en local (el proyecto `desktop-1280`
// no corre en el CI). Para regenerar: `npx playwright test --project=desktop-1280 --update-snapshots`.
// 2026-11-03 (spec 016, aprobado por el usuario): se regeneraron 27 capturas (consumer-home, landing-820,
// landing-1440, admin-home, las 21 panel-admin-*, panel-forgot-password y panel-unlock-account) porque "Rifa(s)"
// pasó a "Sorteo(s)" y su concordancia; el header a 1280 y más no cambió. Detalle en specs/016-*/baseline.md.

interface DesktopPage {
  name: string;
  url: string;
  role: TestRole;
  /** Falso en las listas con scroll infinito: una captura completa agranda la ventana y dispara otra carga. */
  fullPage?: boolean;
  /** Textos que deben verse antes de capturar (la página pide sus datos desde el navegador y puede tardar al arrancar en frío). */
  ready?: string[];
  /**
   * Patrón de la API de una lista con scroll infinito: de ella solo se sirve la primera página. Con la ventana
   * de 800 px el centinela queda a la vista y, según el momento, la página pedía una segunda tanda (6 productos
   * en vez de 3) antes de capturar.
   */
  firstPageOnly?: string;
  /** Congela `Date` (la pantalla pinta la fecha del día y la captura cambiaría cada día). */
  fixedTime?: string;
}

const PAGES: DesktopPage[] = [
  { name: 'consumer-home', url: '/home', role: 'ROLE_CONSUMER' },
  { name: 'consumer-support', url: '/support', role: 'ROLE_CONSUMER' },
  { name: 'consumer-product', url: '/products/1', role: 'ROLE_CONSUMER' },
  { name: 'consumer-commercial', url: `/commercial/${COMMERCIAL_ID}`, role: 'ROLE_CONSUMER' },
  { name: 'consumer-products', url: '/products', role: 'ROLE_CONSUMER', fullPage: false, firstPageOnly: '**/products/filter*', ready: ['3 productos encontrados', 'Consumidor Prueba'] },
  { name: 'commercial-support', url: '/commercial/support', role: 'ROLE_COMMERCIAL' },
  { name: 'commercial-ally', url: `/commercial/allies/${COMMERCIAL_ID}`, role: 'ROLE_COMMERCIAL' },
  { name: 'commercial-product', url: '/commercial/products/1', role: 'ROLE_COMMERCIAL' },
  { name: 'admin-home', url: '/admin', role: 'ROLE_ADMIN', fixedTime: '2026-10-30T10:00:00' },
  { name: 'game-designer-home', url: '/game-designer', role: 'ROLE_GAME_DESIGNER' },
];


/** Espera común antes de capturar: textos, red acotada, fuentes, imágenes visibles y un respiro. */
async function settleForShot(page: Page, ready: string[] = []) {
  for (const text of ready) {
    await expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 });
  }
  // Las páginas de admin precargan sus vecinas y la red nunca queda inactiva: se espera un tiempo acotado.
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
  // `document.fonts.ready` solo espera las fuentes que la página ya pidió. Las caras de otros subconjuntos y pesos
  // (Poppins, IBM Plex) se cargan según qué texto se pinte primero, y un `<select>` nativo mide sus opciones con el
  // estado de las fuentes de ese momento. Se cargan todas las caras declaradas antes de capturar para que el ancho
  // no dependa de la carrera entre la fuente y la captura.
  await page.evaluate(() => Promise.all(Array.from(document.fonts).map((face) => face.load().catch(() => undefined))));
  await page.evaluate(() => document.fonts.ready);
  // Las imágenes de `next/image` son perezosas y las sirve el optimizador recién arrancado: sin esperar a
  // que las visibles terminen de cargar, la captura salía a veces con huecos (`consumer-products`).
  await page
    .waitForFunction(
      () =>
        Array.from(document.images)
          .filter((img) => {
            const rect = img.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
          })
          .every((img) => img.complete && img.naturalWidth > 0),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(800);
}

test.describe('CA-8 · escritorio de referencia', () => {
  for (const entry of PAGES) {
    test(entry.name, async ({ page, context }) => {
      await signIn(context, entry.role);
      if (entry.fixedTime) await page.clock.setFixedTime(new Date(entry.fixedTime));
      if (entry.firstPageOnly) {
        await page.route(entry.firstPageOnly, (route) => {
          const pageParam = new URL(route.request().url()).searchParams.get('page') ?? '0';
          if (pageParam === '0') return route.fallback();
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [],
              meta: { page: Number(pageParam), size: 10, totalElements: 3, totalPages: 1, hasNext: false, hasPrevious: true, sorted: true },
            }),
          });
        });
      }
      await page.goto(entry.url);
      await settleForShot(page, entry.ready);
      await expect(page).toHaveScreenshot(`${entry.name}.png`, {
        fullPage: entry.fullPage ?? true,
        maxDiffPixelRatio: 0.001,
        animations: 'disabled',
      });
    });
  }
});

// Spec 014 (CA-4 y CA-11, D-4 = a). La landing a 820 × 1180 (tablet) y 1440 × 900, sin sesión, y todas las
// páginas de los paneles y de B a 1280 × 800 con su rol y plan. Las de los paneles y B se generaron sobre el
// código sin tocar de la spec; después de cada bloque se comparan y cualquier cambio es un defecto. Las dos de
// la landing se regeneraron una vez (2026-11-03, con aprobación del usuario) tras el rediseño de la landing y la
// barra sin sesión de solo logo e "Iniciar sesión" / "Registrarse" (T47, T47b).

for (const viewport of [
  { name: 'landing-820', width: 820, height: 1180 },
  { name: 'landing-1440', width: 1440, height: 900 },
]) {
  test.describe(`CA-4 · ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test(viewport.name, async ({ page }) => {
      await page.goto('/');
      await settleForShot(page);
      await expect(page).toHaveScreenshot(`${viewport.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
        animations: 'disabled',
      });
    });
  });
}

const slug = (route: string) => route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '') || 'root';

/** Una captura por página (sin las que solo redirigen) y una por paso del onboarding. */
const PANEL_SHOTS: { name: string; entry: PanelPage; variant?: PanelVariant }[] = [
  ...PANEL_PAGES.filter((p) => !p.redirectsTo).map((entry) => ({ name: `panel-${slug(entry.route)}`, entry })),
  // Los seis pasos 2 a 7; la variante del resultado del diagnóstico (T15) es solo para el modal de detalle del plan.
  ...(PANEL_PAGES.find((p) => p.route === '/commercial-onboarding')?.variants ?? []).slice(0, 6).map((variant, i) => ({
    name: `panel-commercial-onboarding-paso-${i + 2}`,
    entry: PANEL_PAGES.find((p) => p.route === '/commercial-onboarding')!,
    variant,
  })),
];

test.describe('CA-11 · paneles y páginas públicas a 1280 px', () => {
  for (const { name, entry, variant } of PANEL_SHOTS) {
    test(name, async ({ page, context }) => {
      await page.clock.setFixedTime(new Date('2026-10-30T10:00:00'));
      await gotoPanelPage(page, context, entry, { variant });
      await settleForShot(page, [variant?.expectText ?? entry.expectText].filter((t): t is string => !!t));
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
        animations: 'disabled',
      });
    });
  }
});
