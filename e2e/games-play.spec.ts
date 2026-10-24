import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { PAGES } from './support/pages';
import { signIn } from './support/session';

// CA-11 (spec 013): `/games/play` en el celular. En horizontal va a pantalla completa, sin barras y con
// "Volver" (a `/games`); en vertical no cambia: capa fija con el juego girado.

const PORTRAIT = { width: 360, height: 740 };
const LANDSCAPE = { width: 740, height: 360 };
const URL = PAGES.find((p) => p.route === '/games/play')!.url;

test.beforeEach(async ({ context }) => {
  await signIn(context);
});

test.describe('CA-11 · horizontal 740 × 360', () => {
  test.use({ viewport: LANDSCAPE });

  test('sin barras, el juego ocupa la ventana sin scroll y "Volver" lleva a /games', async ({ page }) => {
    await page.goto(URL);
    await settle(page);
    const frame = page.locator('iframe');
    await expect(frame).toBeVisible();
    await expect(page.locator('[data-app-bar="top"]')).toBeHidden();
    await expect(page.locator('[data-app-bar="bottom"]')).toBeHidden();
    const m = await frame.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const d = document.documentElement;
      return { x: r.x, y: r.y, w: r.width, h: r.height, viewW: d.clientWidth, viewH: d.clientHeight, docH: d.scrollHeight, docW: d.scrollWidth };
    });
    expect(Math.abs(m.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.w - m.viewW)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.h - m.viewH)).toBeLessThanOrEqual(1);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);

    const back = page.getByRole('button', { name: 'Volver a juegos' });
    await expect(back).toBeVisible();
    const box = (await back.boundingBox())!;
    expect(box.width, 'ancho de "Volver"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    expect(box.height, 'alto de "Volver"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(LANDSCAPE.width);
    expect(box.y + box.height).toBeLessThanOrEqual(LANDSCAPE.height);
    await back.tap();
    await expect(page).toHaveURL(/\/games$/);
    await settle(page);
  });
});

test.describe('CA-11 · vertical 360 × 740 (igual que hoy)', () => {
  test.use({ viewport: PORTRAIT });

  test('capa fija con el juego girado y "Volver" visible de 44 px', async ({ page }) => {
    await page.goto(URL);
    await settle(page);
    const frame = page.locator('iframe');
    await expect(frame).toBeVisible();
    const layer = await frame.evaluate((el) => {
      const parent = el.parentElement!;
      return { position: getComputedStyle(parent).position, transform: getComputedStyle(el).transform };
    });
    expect(layer.position).toBe('fixed');
    expect(layer.transform).not.toBe('none');
    const back = page.getByRole('button', { name: 'Volver a juegos' });
    await expect(back).toBeVisible();
    const box = (await back.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  });
});
