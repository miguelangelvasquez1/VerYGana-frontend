import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn } from './support/session';

// Spec 012 (CA-7, RN-7): en vertical `/pet` se ve con las barras y el aviso de girar, sin scroll. Spec 013:
// en horizontal en el celular (táctil, < 1024 px) la mascota va a pantalla completa, sin barras y con "Salir"
// (reemplaza la D-7 de la 012); el giro no recarga el juego (RN-2). En escritorio no cambia nada.

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
    await expect(page.locator('[data-app-bar="top"]')).toBeVisible();
    await expect(page.locator('[data-app-bar="bottom"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Salir' })).toBeHidden();
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

const FRAME = 'iframe[title="Mascota Virtual"]';
const exitLink = (page: Page) => page.getByRole('link', { name: 'Salir' });

/** Comprueba que "Salir" se ve, mide 44 × 44, está en el viewport y recibe el toque en su centro. */
async function expectExitReachable(page: Page, viewport: { width: number; height: number }) {
  const link = exitLink(page);
  await expect(link).toBeVisible();
  const box = (await link.boundingBox())!;
  expect(box.width, 'ancho de "Salir"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  expect(box.height, 'alto de "Salir"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  const topIsLink = await link.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });
  expect(topIsLink, 'el centro de "Salir" recibe el toque').toBe(true);
  return box;
}

test.describe('CA-1 · horizontal 740 × 360, pantalla completa', () => {
  test.use({ viewport: LANDSCAPE });

  test('CA-1: sin barras, el marco ocupa la ventana y no hay scroll', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    const frame = page.locator(FRAME);
    await expect(frame).toBeVisible();
    await expect(page.getByText('Gira tu teléfono')).toBeHidden();
    await expect(page.locator('[data-app-bar="top"]')).toBeHidden();
    await expect(page.locator('[data-app-bar="bottom"]')).toBeHidden();
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
    const parent = await frame.evaluate((el) => {
      const p = el.parentElement!;
      const r = p.getBoundingClientRect();
      return {
        x: r.x, y: r.y, w: r.width, h: r.height,
        scrollH: p.scrollHeight, clientH: p.clientHeight, scrollW: p.scrollWidth, clientW: p.clientWidth,
        viewW: document.documentElement.clientWidth, viewH: document.documentElement.clientHeight,
      };
    });
    expect(Math.abs(parent.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(parent.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(parent.w - parent.viewW)).toBeLessThanOrEqual(1);
    expect(Math.abs(parent.h - parent.viewH)).toBeLessThanOrEqual(1);
    expect(parent.scrollH).toBeLessThanOrEqual(parent.clientH);
    expect(parent.scrollW).toBeLessThanOrEqual(parent.clientW);
  });

  test('CA-3: girar a vertical y volver no recarga el iframe y las barras siguen la orientación', async ({ page }) => {
    let gameRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/pet-game-stub')) gameRequests += 1;
    });
    await page.goto('/pet');
    await settle(page);
    const frameEl = page.locator(FRAME);
    await expect(frameEl).toBeVisible();
    await frameEl.evaluate((el) => el.setAttribute('data-e2e-mark', 'misma-instancia'));
    const handle = await frameEl.elementHandle();
    const contentFrame = (await handle!.contentFrame())!;
    await contentFrame.evaluate(() => {
      (window as unknown as { __e2eMark: string }).__e2eMark = 'sin-recarga';
    });
    const top = page.locator('[data-app-bar="top"]');
    const bottom = page.locator('[data-app-bar="bottom"]');
    await expect(top).toBeHidden();

    await page.setViewportSize(PORTRAIT);
    await expect(top).toBeVisible();
    await expect(bottom).toBeVisible();
    await expect(page.getByText('Gira tu teléfono')).toBeVisible();

    await page.setViewportSize(LANDSCAPE);
    await expect(top).toBeHidden();
    await expect(bottom).toBeHidden();
    await expect(page.getByText('Gira tu teléfono')).toBeHidden();
    await settle(page);

    await expect(frameEl).toHaveAttribute('data-e2e-mark', 'misma-instancia');
    const mark = await contentFrame.evaluate(() => (window as unknown as { __e2eMark?: string }).__e2eMark);
    expect(mark, 'la ventana del juego se recargó al girar (RN-2)').toBe('sin-recarga');
    expect(gameRequests, 'pedidos al juego').toBe(1);
  });
});

test.describe('CA-4 · "Salir" en horizontal', () => {
  test.use({ viewport: LANDSCAPE });

  test('cargando: "Salir" visible y lleva a /home', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/pet/session/init', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/pet');
    await expect(page.getByText('Preparando tu mascota…')).toBeVisible();
    await expectExitReachable(page, LANDSCAPE);
    release();
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('error: "Salir" visible, no se cruza con "Reintentar" y lleva a /home', async ({ page }) => {
    await page.route('**/pet/session/init', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
    );
    await page.goto('/pet');
    const retry = page.getByRole('button', { name: 'Reintentar' });
    await expect(retry).toBeVisible();
    const exit = await expectExitReachable(page, LANDSCAPE);
    const r = (await retry.boundingBox())!;
    const overlap = exit.x < r.x + r.width && exit.x + exit.width > r.x && exit.y < r.y + r.height && exit.y + exit.height > r.y;
    expect(overlap, '"Salir" tapa "Reintentar"').toBe(false);
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('juego: "Salir" visible y lleva a /home', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.locator(FRAME)).toBeVisible();
    await expectExitReachable(page, LANDSCAPE);
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
  });
});

test.describe('CA-5 · escritorio 1280 × 800', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test('igual que hoy: barra de escritorio, juego en su marco y sin "Salir"', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.locator('nav.lg\\:block').first()).toBeVisible();
    // `toBeHidden` también pasa si el elemento no existe: se exige que existan para que la comprobación valga.
    await expect(page.locator('[data-app-bar="top"]')).toHaveCount(1);
    await expect(page.locator('[data-app-bar="bottom"]')).toHaveCount(1);
    await expect(page.locator('[data-app-bar="top"]')).toBeHidden();
    await expect(page.locator('[data-app-bar="bottom"]')).toBeHidden();
    await expect(exitLink(page)).toBeHidden();
    const frame = page.locator(FRAME);
    await expect(frame).toBeVisible();
    const info = await frame.evaluate((el) => {
      let fixed = false;
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).position === 'fixed') fixed = true;
      }
      return { fixed, inMain: !!el.closest('main') };
    });
    expect(info.inMain, 'el iframe va dentro de main').toBe(true);
    expect(info.fixed, 'el iframe no va en una capa fija').toBe(false);
  });
});

test.describe('Ventana angosta de escritorio (puntero fino) 900 × 500', () => {
  test.use({ viewport: { width: 900, height: 500 }, isMobile: false, hasTouch: false });

  test('mantiene las barras del celular y no muestra "Salir"', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.locator('[data-app-bar="top"]')).toBeVisible();
    await expect(page.locator('[data-app-bar="bottom"]')).toBeVisible();
    await expect(exitLink(page)).toBeHidden();
  });
});
