import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn } from './support/session';

// CA-7 y RN-7 (spec 012): `/pet` llena el alto disponible sin barras de scroll. En vertical se ve el aviso
// de girar; en horizontal, el juego. Cargando y error se leen completos a 360 px. Se mide con las barras del
// consumidor puestas (D-7 = a): el marco ocupa lo que ellas dejan.

const PORTRAIT = { width: 360, height: 740 };
const LANDSCAPE = { width: 740, height: 360 };

async function noScroll(page: Page) {
  return page.evaluate(() => ({
    docH: document.documentElement.scrollHeight,
    viewH: document.documentElement.clientHeight,
    docW: document.documentElement.scrollWidth,
    viewW: document.documentElement.clientWidth,
  }));
}

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

test.describe('CA-7 · vertical 360 × 740', () => {
  test.use({ viewport: PORTRAIT });

  test('R-3: el emulador responde a pointer: coarse y orientation', async ({ page }) => {
    await page.goto('/pet');
    const media = await page.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      fine: matchMedia('(pointer: fine)').matches,
      landscape: matchMedia('(orientation: landscape)').matches,
    }));
    expect(media, 'el emulador táctil no responde como espera RotateHint (riesgo R-3)').toEqual({
      coarse: true,
      fine: false,
      landscape: false,
    });
  });

  test('se ve "Gira tu teléfono" y el documento no hace scroll', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.getByText('Gira tu teléfono')).toBeVisible();
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
  });

  test('cargando: "Preparando tu mascota…" se lee entero', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/pet/session/init', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/pet');
    const text = page.getByText('Preparando tu mascota…');
    await expect(text).toBeVisible();
    const box = await text.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(PORTRAIT.width);
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    release();
  });

  test('error: el mensaje cabe y "Reintentar" mide al menos 44 px', async ({ page }) => {
    await page.route('**/pet/session/init', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
    );
    await page.goto('/pet');
    const retry = page.getByRole('button', { name: 'Reintentar' });
    await expect(retry).toBeVisible();
    const box = await retry.boundingBox();
    expect(box!.height, 'alto de "Reintentar"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    expect(box!.width, 'ancho de "Reintentar"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
    const paragraph = await retry.locator('xpath=preceding-sibling::p').boundingBox();
    expect(paragraph, 'el mensaje de error se pinta').not.toBeNull();
    expect(paragraph!.x).toBeGreaterThanOrEqual(0);
    expect(paragraph!.x + paragraph!.width).toBeLessThanOrEqual(PORTRAIT.width);
  });
});

test.describe('CA-7 · horizontal 740 × 360', () => {
  test.use({ viewport: LANDSCAPE });

  test('se ve el juego, no el aviso, y no hay scroll en el documento ni en el marco', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    const frame = page.locator('iframe[title="Mascota Virtual"]');
    await expect(frame).toBeVisible();
    await expect(page.getByText('Gira tu teléfono')).toBeHidden();
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
    const box = await frame.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(LANDSCAPE.height);
    // El marco (el contenedor del iframe) tampoco desborda su propio alto.
    const parent = await frame.evaluate((el) => {
      const p = el.parentElement!;
      return { scrollH: p.scrollHeight, clientH: p.clientHeight, scrollW: p.scrollWidth, clientW: p.clientWidth };
    });
    expect(parent.scrollH).toBeLessThanOrEqual(parent.clientH);
    expect(parent.scrollW).toBeLessThanOrEqual(parent.clientW);
  });
});
