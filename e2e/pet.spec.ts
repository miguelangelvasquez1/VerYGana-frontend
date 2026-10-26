import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn } from './support/session';

// Spec 013: en el celular (táctil, < 1024 px) la mascota va a pantalla completa, sin barras y con "Salir"
// (reemplaza la D-7 de la 012). En horizontal va derecha; en vertical (cambio de la ronda 3, RN-10) la
// sección entera gira 90° con CSS, como `/games/play`, y "Gira tu teléfono" queda solo de respaldo. El giro
// del teléfono no recarga el juego (RN-2). En escritorio no cambia nada.

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

/** Caja en pantalla (ya con la transformación) y tamaño de maquetación (sin ella) de un elemento. */
async function frameBox(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const h = el as HTMLElement;
    return { x: r.x, y: r.y, w: r.width, h: r.height, layoutW: h.offsetWidth, layoutH: h.offsetHeight };
  });
}

/** El elemento va derecho en horizontal: caja en pantalla igual a la maquetación y a la ventana. */
function expectUpright(box: Awaited<ReturnType<typeof frameBox>>) {
  expect(Math.abs(box.w - LANDSCAPE.width), `ancho en pantalla ${box.w}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.h - LANDSCAPE.height), `alto en pantalla ${box.h}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.layoutW - LANDSCAPE.width), `ancho de maquetación ${box.layoutW}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.layoutH - LANDSCAPE.height), `alto de maquetación ${box.layoutH}`).toBeLessThanOrEqual(1);
}

/** El elemento está girado 90°: llena la pantalla vertical y su maquetación es la de un horizontal. */
function expectRotated(box: Awaited<ReturnType<typeof frameBox>>, label: string) {
  const view = PORTRAIT;
  expect(Math.abs(box.x), `${label}: x`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.y), `${label}: y`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.w - view.width), `${label}: ancho en pantalla ${box.w}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.h - view.height), `${label}: alto en pantalla ${box.h}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.layoutW - view.height), `${label}: ancho de maquetación ${box.layoutW}`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.layoutH - view.width), `${label}: alto de maquetación ${box.layoutH}`).toBeLessThanOrEqual(1);
}

async function expectNoBars(page: Page) {
  // `toBeHidden` también pasa si el elemento no existe: se exige que existan.
  await expect(page.locator('[data-app-bar="top"]')).toHaveCount(1);
  await expect(page.locator('[data-app-bar="bottom"]')).toHaveCount(1);
  await expect(page.locator('[data-app-bar="top"]')).toBeHidden();
  await expect(page.locator('[data-app-bar="bottom"]')).toBeHidden();
  await expect(page.getByText('Gira tu teléfono')).toBeHidden();
}

test.describe('CA-2 · vertical 360 × 740, girada', () => {
  test.use({ viewport: PORTRAIT });

  test('R-3: el emulador responde a pointer: coarse y orientation', async ({ page }) => {
    await page.goto('/pet');
    const media = await page.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      fine: matchMedia('(pointer: fine)').matches,
      landscape: matchMedia('(orientation: landscape)').matches,
    }));
    expect(media, 'el emulador táctil no responde como espera la variante immersive-portrait (riesgo R-3)').toEqual({
      coarse: true,
      fine: false,
      landscape: false,
    });
  });

  test('juego: sin barras ni aviso, el iframe llena la pantalla girado y no hay scroll', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.locator(FRAME)).toBeVisible();
    await expectNoBars(page);
    expectRotated(await frameBox(page, FRAME), 'iframe');
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
  });

  test('cargando: el marco llena la pantalla girado y "Preparando tu mascota…" cabe', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/pet/session/init', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/pet');
    const text = page.getByText('Preparando tu mascota…');
    await expect(text).toBeVisible();
    await expectNoBars(page);
    expectRotated(await frameBox(page, 'div:has(> p:text("Preparando tu mascota…"))'), 'marco');
    const box = (await text.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(PORTRAIT.width);
    expect(box.y + box.height).toBeLessThanOrEqual(PORTRAIT.height);
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
    release();
  });

  test('error: el marco llena la pantalla girado y "Reintentar" se puede tocar', async ({ page }) => {
    await page.route('**/pet/session/init', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
    );
    await page.goto('/pet');
    const retry = page.getByRole('button', { name: 'Reintentar' });
    await expect(retry).toBeVisible();
    await expectNoBars(page);
    expectRotated(await frameBox(page, 'div:has(> button:text("Reintentar"))'), 'marco');
    const box = (await retry.boundingBox())!;
    expect(box.height, 'alto de "Reintentar"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    expect(box.width, 'ancho de "Reintentar"').toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    const topIsButton = await retry.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !!hit && (hit === el || el.contains(hit));
    });
    expect(topIsButton, 'el centro de "Reintentar" recibe el toque').toBe(true);
    const m = await noScroll(page);
    expect(m.docH).toBeLessThanOrEqual(m.viewH);
    expect(m.docW).toBeLessThanOrEqual(m.viewW);
    const second = page.waitForRequest((req) => req.url().includes('/pet/session/init') && req.method() === 'POST');
    await retry.tap();
    await second;
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

  test('CA-3: girar a vertical y volver no recarga el iframe; sin barras en ninguna de las dos', async ({ page }) => {
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
    await expectNoBars(page);
    expectUpright(await frameBox(page, FRAME));

    await page.setViewportSize(PORTRAIT);
    await expectNoBars(page);
    await expect.poll(async () => (await frameBox(page, FRAME)).layoutW, 'el iframe no giró').toBeGreaterThan(PORTRAIT.height - 2);
    expectRotated(await frameBox(page, FRAME), 'iframe en vertical');

    await page.setViewportSize(LANDSCAPE);
    await expectNoBars(page);
    await settle(page);
    expectUpright(await frameBox(page, FRAME));

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

test.describe('CA-4 · "Salir" en vertical girado', () => {
  test.use({ viewport: PORTRAIT });

  /** "Salir" gira con el juego: es más alto que ancho y cae abajo a la izquierda de la pantalla. */
  async function expectExitRotated(page: Page) {
    const box = await expectExitReachable(page, PORTRAIT);
    expect(box.height, '"Salir" va girado: más alto que ancho').toBeGreaterThan(box.width);
    expect(box.x + box.width / 2, 'centro de "Salir" en la mitad izquierda').toBeLessThan(PORTRAIT.width / 2);
    expect(box.y + box.height / 2, 'centro de "Salir" en la mitad de abajo').toBeGreaterThan(PORTRAIT.height / 2);
    return box;
  }

  test('cargando: "Salir" visible, girado y lleva a /home', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/pet/session/init', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/pet');
    await expect(page.getByText('Preparando tu mascota…')).toBeVisible();
    await expectExitRotated(page);
    release();
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
    await settle(page);
  });

  test('error: "Salir" visible, no se cruza con "Reintentar" y lleva a /home', async ({ page }) => {
    await page.route('**/pet/session/init', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
    );
    await page.goto('/pet');
    const retry = page.getByRole('button', { name: 'Reintentar' });
    await expect(retry).toBeVisible();
    const exit = await expectExitRotated(page);
    const r = (await retry.boundingBox())!;
    const overlap = exit.x < r.x + r.width && exit.x + exit.width > r.x && exit.y < r.y + r.height && exit.y + exit.height > r.y;
    expect(overlap, '"Salir" tapa "Reintentar"').toBe(false);
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
    await settle(page);
  });

  test('juego: "Salir" visible, girado y lleva a /home', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    await expect(page.locator(FRAME)).toBeVisible();
    await expectExitRotated(page);
    await exitLink(page).tap();
    await expect(page).toHaveURL(/\/home$/);
    await settle(page);
  });
});

test.describe('CA-13 · toques en el juego girado', () => {
  test.use({ viewport: PORTRAIT });

  test('un toque en pantalla llega al juego en sus propias coordenadas', async ({ page }) => {
    await page.goto('/pet');
    await settle(page);
    const frameEl = page.locator(FRAME);
    await expect(frameEl).toBeVisible();
    const contentFrame = (await (await frameEl.elementHandle())!.contentFrame())!;
    const size = await contentFrame.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    expect(Math.abs(size.w - LANDSCAPE.width), `innerWidth del juego ${size.w}`).toBeLessThanOrEqual(2);
    expect(Math.abs(size.h - LANDSCAPE.height), `innerHeight del juego ${size.h}`).toBeLessThanOrEqual(2);

    // (x, y) en pantalla = (gy, vh - gx) para el punto (gx, gy) del juego (plan 19.6).
    const taps = [
      { screen: { x: 90, y: 580 }, game: { x: 160, y: 90 } },
      { screen: { x: 300, y: 140 }, game: { x: 600, y: 300 } },
    ];
    let count = 0;
    for (const tap of taps) {
      await page.touchscreen.tap(tap.screen.x, tap.screen.y);
      count += 1;
      await expect
        .poll(
          async () =>
            contentFrame.evaluate(() => Number(document.documentElement.dataset.pointerCount || 0)),
          `el juego no recibió el toque en (${tap.screen.x}, ${tap.screen.y})`,
        )
        .toBeGreaterThanOrEqual(count);
      const last = JSON.parse(
        (await contentFrame.evaluate(() => document.documentElement.dataset.lastPointer)) ?? 'null',
      ) as { x: number; y: number };
      expect(Math.abs(last.x - tap.game.x), `x del juego ${last.x}`).toBeLessThanOrEqual(2);
      expect(Math.abs(last.y - tap.game.y), `y del juego ${last.y}`).toBeLessThanOrEqual(2);
    }
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
