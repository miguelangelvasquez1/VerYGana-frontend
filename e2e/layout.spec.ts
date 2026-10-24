import type { BrowserContext, Page } from '@playwright/test';
import { PAGES, type ScopePage } from './support/pages';
import { expect, test } from './support/network';
import { measureOverflow, MIN_TOUCH_PX, nestedInteractive, settle } from './support/measure';
import { signIn } from './support/session';

// CA-1 y CA-4 en el DOM (spec 012): sin scroll horizontal a 360, 390 y 768 px, el estado de error a
// 360 px sin desborde, y sin botones dentro de enlaces. Una prueba por página y proyecto.

const MOBILE_360 = 'mobile-360';

function overflowMessage(r: Awaited<ReturnType<typeof measureOverflow>>): string {
  return `documento ${r.documentWidth}px y body ${r.bodyWidth}px contra viewport ${r.viewport}px; se pasan: ${r.offenders.join(' | ')}`;
}

async function open(page: Page, context: BrowserContext, entry: ScopePage, url = entry.url) {
  if (entry.session) await signIn(context);
  await page.goto(url);
  await settle(page);
}

test.describe('CA-1 · sin scroll horizontal', () => {
  for (const entry of PAGES) {
    test(`${entry.route}`, async ({ page, context }) => {
      await open(page, context, entry);
      const report = await measureOverflow(page);
      expect(report.documentWidth, overflowMessage(report)).toBeLessThanOrEqual(report.viewport);
      expect(report.bodyWidth, overflowMessage(report)).toBeLessThanOrEqual(report.viewport);
    });
  }
});

test.describe('CA-1 · estado de error a 360 px', () => {
  for (const entry of PAGES.filter((p) => p.errorApi.length > 0 || p.errorUrl)) {
    test(`${entry.route}`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== MOBILE_360, 'el estado de error se mide a 360 px');
      for (const pattern of entry.errorApi) {
        await page.route(pattern, (route) =>
          route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
        );
      }
      await open(page, context, entry, entry.errorUrl ?? entry.url);
      const report = await measureOverflow(page);
      expect(report.documentWidth, overflowMessage(report)).toBeLessThanOrEqual(report.viewport);
      expect(report.bodyWidth, overflowMessage(report)).toBeLessThanOrEqual(report.viewport);
    });
  }
});

test.describe('CA-4 · sin botones dentro de enlaces (DOM)', () => {
  for (const entry of PAGES) {
    test(`${entry.route}`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== MOBILE_360, 'el DOM no cambia con el ancho: se revisa a 360 px');
      await open(page, context, entry);
      expect(await nestedInteractive(page)).toEqual([]);
    });
  }
});

test.describe('CA-1 y CA-2 · carrito abierto a 360 px', () => {
  test('el cajón cabe en pantalla y sus botones miden 44 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'el cajón se mide a 360 px');
    await signIn(context);
    // El carrito vive en localStorage (CartService): se siembra con un producto ficticio antes de cargar.
    await page.addInitScript(() => {
      localStorage.setItem(
        'shopping_cart',
        JSON.stringify([
          {
            productId: 1,
            name: 'Producto de prueba con un nombre bastante largo para comprobar el recorte',
            imageUrl: '/logos/logo.png',
            price: 125000,
            maxKeysAllowed: 10,
            minCashCents: 0,
            quantity: 2,
            stock: 5,
            categoryName: 'Categoría de prueba',
          },
        ]),
      );
    });
    await page.goto('/home');
    await settle(page);
    await page.getByRole('button', { name: 'Carrito de compras' }).click();
    const drawer = page.locator('div.fixed.right-0', { has: page.getByRole('heading', { name: 'Carrito de Compras' }) });
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(500); // termina la animación de entrada

    const report = await drawer.evaluate((el, min) => {
      const viewport = document.documentElement.clientWidth;
      const box = el.getBoundingClientRect();
      const small = Array.from(el.querySelectorAll('button, a[href]'))
        .map((b) => ({ label: (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().slice(0, 30), rect: b.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width < min - 0.5 || rect.height < min - 0.5)
        .map(({ label, rect }) => `${label} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      const outside = Array.from(el.querySelectorAll('*'))
        .filter((child) => child.getBoundingClientRect().right > viewport + 1)
        .slice(0, 5)
        .map((child) => `${child.tagName.toLowerCase()} "${(child.textContent ?? '').trim().slice(0, 20)}"`);
      return { left: box.left, right: box.right, viewport, small, outside };
    }, MIN_TOUCH_PX);

    expect(report.left).toBeGreaterThanOrEqual(0);
    expect(report.right).toBeLessThanOrEqual(report.viewport + 1);
    expect(report.outside, 'elementos del cajón fuera de la pantalla').toEqual([]);
    expect(report.small, 'botones del cajón de menos de 44 x 44').toEqual([]);
  });
});
