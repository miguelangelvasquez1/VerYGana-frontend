import { expect, test } from './support/network';
import { COMMERCIAL_ID } from './support/pages';
import { signIn, type TestRole } from './support/session';

// Capturas de escritorio de referencia (spec 012, CA-8 y D-4): las páginas que usan componentes
// compartidos con otros roles, a 1280 × 800. Se generan sobre el código sin cambios y después de tocar los
// compartidos se comparan. Dependen del sistema operativo: solo corren en local (el proyecto `desktop-1280`
// no corre en el CI). Para regenerar: `npx playwright test --project=desktop-1280 --update-snapshots`.

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
  { name: 'admin-home', url: '/admin', role: 'ROLE_ADMIN' },
  { name: 'game-designer-home', url: '/game-designer', role: 'ROLE_GAME_DESIGNER' },
];

test.describe('CA-8 · escritorio de referencia', () => {
  for (const entry of PAGES) {
    test(entry.name, async ({ page, context }) => {
      await signIn(context, entry.role);
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
      for (const text of entry.ready ?? []) {
        await expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 });
      }
      // Las páginas de admin precargan sus vecinas y la red nunca queda inactiva: se espera un tiempo acotado.
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
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
      await expect(page).toHaveScreenshot(`${entry.name}.png`, {
        fullPage: entry.fullPage ?? true,
        maxDiffPixelRatio: 0.001,
        animations: 'disabled',
      });
    });
  }
});
