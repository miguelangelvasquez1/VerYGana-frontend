import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { measureDesktopHeader, settle, type DesktopHeaderReport } from './support/measure';
import { signIn } from './support/session';
import { DESKTOP_NAV_LABELS_MIN_WIDTH_PX as N } from '../src/components/bars/mobileNav';
import initialData from './fixtures/api/consumers/initialData.json';

// Header de escritorio en portátiles (spec 016, CA-7, RN-5): a cada ancho desde 1024 ningún elemento se
// superpone, se sale de la barra ni corta su texto; por debajo del corte los accesos son íconos con nombre
// accesible, y desde el corte llevan su texto. Corre una vez, dentro del proyecto `mobile-360`.

const WIDTHS = [1024, 1280, 1366, 1440, 1536, 1600, 1680, 1728, 1800, 1920];
const PAGES = [
  { url: '/home', active: 'Inicio' },
  { url: '/surveys', active: 'Encuestas' },
];
const EDGE_WIDTHS = [N - 1, N];
const LONG_NAME = 'Maria Fernanda Gonzalez Perez Ruiz'.slice(0, 30);

test.beforeEach(async ({ context }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'el ancho lo fija cada caso; corre una sola vez');
  await signIn(context);
});

async function openHeader(page: Page, url: string, width: number, name?: string) {
  await page.setViewportSize({ width, height: 900 });
  await page.route('**/consumers/initialData', (route) =>
    route.fulfill({ json: { ...initialData, totalAvailableKeys: 9999, ...(name ? { name } : {}) } }),
  );
  await page.goto(url);
  await settle(page);
  await expect(page.locator('nav.lg\\:block').getByText('9.999').first()).toBeVisible();
  return measureDesktopHeader(page);
}

function expectClean(report: DesktopHeaderReport) {
  expect(report.crossings, 'elementos que se cruzan').toEqual([]);
  expect(report.outside, 'elementos fuera de la barra').toEqual([]);
  expect(report.clipped, 'textos cortados').toEqual([]);
}

test.use({ isMobile: false, hasTouch: false });

test.describe('CA-7 · medición (solo informa)', () => {
  for (const { url } of PAGES) {
    test(`${url}: ancho necesario con textos (1920) y con íconos (1280)`, async ({ page }, info) => {
      const text = await openHeader(page, url, 1920);
      const icon = await openHeader(page, url, 1280);
      // Compactado (D-2 = a): ancho que necesita el header entre 1024 y 1279 px, medido a 1279 donde sí cabe.
      const compact = await openHeader(page, url, 1279);
      const long = await openHeader(page, url, 1920, LONG_NAME);
      await info.attach('medidas', {
        body: JSON.stringify({ url, W_texto: text.intrinsic, text, W_icono_a_1280: icon.intrinsic, icon, W_icono_compacto_1279: compact.intrinsic, compact, W_texto_nombre_largo: long.intrinsic }, null, 2),
        contentType: 'application/json',
      });
    });
  }
});

test.describe('CA-7 · sin solapes', () => {
  for (const { url, active } of PAGES) {
    for (const width of WIDTHS) {
      test(`${url} a ${width} px`, async ({ page }) => {
        const report = await openHeader(page, url, width);
        expectClean(report);
        const labels = report.modes.map((m) => m.label);
        expect(labels).toContain(active);
        const expected = width >= N ? 'text' : 'icon';
        for (const m of report.modes) {
          expect(m.mode, `modo de "${m.label}" a ${width} px`).toBe(expected);
          expect(m.ariaLabel).toBe(m.label);
          expect(m.title).toBe(m.label);
        }
      });
    }
    for (const width of EDGE_WIDTHS) {
      test(`${url} en el borde del corte (${width} px)`, async ({ page }) => {
        const report = await openHeader(page, url, width);
        expectClean(report);
        expect(report.modes.every((m) => m.mode === (width >= N ? 'text' : 'icon'))).toBe(true);
      });
    }
  }
});

test.describe('CA-2 · nombre accesible', () => {
  test('cada acceso tiene aria-label y title con su etiqueta', async ({ page }) => {
    const report = await openHeader(page, '/home', 1280);
    for (const m of report.modes) {
      expect(m.ariaLabel, `aria-label de "${m.label}"`).toBe(m.label);
      expect(m.title, `title de "${m.label}"`).toBe(m.label);
    }
  });
});

test.describe('CA-7 · perfil compacto (D-2 ampliada)', () => {
  for (const width of [1024, 1100, 1279, 1280, 1366]) {
    test(`el nombre del perfil ${width >= 1280 ? 'se ve' : 'se oculta pero sigue accesible'} a ${width} px`, async ({ page }) => {
      await openHeader(page, '/home', width);
      const nav = page.locator('nav.lg\\:block');
      // El botón conserva su nombre accesible en todos los anchos.
      const button = nav.getByRole('button', { name: /Consumidor Prueba/ });
      await expect(button).toHaveCount(1);
      const label = button.locator('div.font-semibold');
      const box = await label.boundingBox();
      if (width >= 1280) {
        expect(box?.width ?? 0, 'nombre visible').toBeGreaterThan(20);
      } else {
        expect(box?.width ?? 0, 'nombre oculto a la vista').toBeLessThanOrEqual(1);
      }
      // El menú desplegable siempre muestra el nombre.
      await button.click();
      await expect(nav.locator('div.truncate', { hasText: 'Consumidor Prueba' })).toBeVisible();
    });
  }
});

test('la barra sin sesión de / a 1440 no tiene accesos', async ({ page, context }) => {
  await context.clearCookies();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await settle(page);
  const nav = page.locator('nav.lg\\:block');
  await expect(nav.getByRole('link', { name: 'Sorteos', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
});

// La barra sin sesión no cambia con la 016 (D-2 solo compacta la del consumidor con sesión): entre 1024 y 1279 px
// conserva el texto del logo, el relleno de 24 px y la separación de 24 px de las acciones.
for (const width of [1024, 1100, 1279]) {
  test(`la barra sin sesión de / a ${width} px conserva texto del logo, relleno y separación`, async ({ page, context }) => {
    await context.clearCookies();
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await settle(page);
    const nav = page.locator('nav.lg\\:block');
    await expect(nav.getByText('VERyGANA', { exact: true })).toBeVisible();
    await expect(nav.getByText('La alegria de ganar')).toBeVisible();
    const row = nav.locator('> div').first();
    await expect(row).toHaveCSS('padding-left', '24px');
    await expect(row).toHaveCSS('padding-right', '24px');
    await expect(row.locator('> div').last()).toHaveCSS('column-gap', '24px');
  });
}
