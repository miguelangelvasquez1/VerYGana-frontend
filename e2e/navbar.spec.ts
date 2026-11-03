import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn } from './support/session';

// CA-6, CA-7 y CA-8 (spec 013): la barra inferior del celular tiene Juegos en el lugar de Rifas, y Rifas
// está en el menú de Perfil. Se mide a 360 px de ancho, en vertical.

const BAR_LABELS = ['Inicio', 'Anuncios', 'Juegos', 'Mascota', 'Productos', 'Perfil'];
const bottomBar = (page: import('@playwright/test').Page) => page.locator('nav[aria-label="Navegación inferior"]');

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

test.describe('CA-6 · barra inferior', () => {
  // `/pet` no está: en vertical, en el celular, la mascota va girada a pantalla completa y sin barras (RN-1,
  // RN-10); su comprobación está en `pet.spec.ts`. `/products` la reemplaza para seguir probando la barra.
  for (const url of ['/home', '/games', '/ads', '/products']) {
    test(`${url}: Inicio, Anuncios, Juegos, Mascota, Productos y Perfil, de 44 × 44 px`, async ({ page }) => {
      await page.goto(url);
      await settle(page);
      const bar = bottomBar(page);
      await expect(bar).toBeVisible();
      const items = bar.locator('a, button');
      await expect(items).toHaveCount(BAR_LABELS.length);
      expect(await items.allInnerTexts()).toEqual(BAR_LABELS);
      for (const [index, label] of BAR_LABELS.entries()) {
        const box = await items.nth(index).boundingBox();
        expect(box!.width, `ancho de "${label}"`).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
        expect(box!.height, `alto de "${label}"`).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
      }
      await expect(bar.getByRole('link', { name: 'Juegos', exact: true })).toHaveAttribute('href', '/games');
      await expect(bar.getByRole('link', { name: 'Rifas' })).toHaveCount(0);
    });
  }

  test('tocar Juegos lleva a /games', async ({ page }) => {
    await page.goto('/home');
    await settle(page);
    await bottomBar(page).getByRole('link', { name: 'Juegos', exact: true }).tap();
    await expect(page).toHaveURL(/\/games$/);
    await settle(page);
  });
});

test('CA-7 · en /games, Juegos se ve activo', async ({ page }) => {
  await page.goto('/games');
  await settle(page);
  await expect(bottomBar(page).getByRole('link', { name: 'Juegos', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('CA-8 · el menú de Perfil tiene Rifas y lleva a /raffles', async ({ page }) => {
  await page.goto('/home');
  await settle(page);
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  const link = page.locator('div.py-2.pb-20').getByRole('link', { name: 'Rifas', exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/raffles');
  await link.click();
  await expect(page).toHaveURL(/\/raffles$/);
});
