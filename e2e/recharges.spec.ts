import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn } from './support/session';
import { gotoPanelPage } from './support/panelOpen';
import { PANEL_PAGES } from './support/panelPages';

// Recargas en desarrollo (spec 016, CA-4, CA-5 y CA-6; plan 3.9). `/plans/mobile-plans` muestra un aviso encima
// del contenido desenfocado. 360 corre en el proyecto; 1280 corre dentro de `mobile-360` con otro viewport.

const URL_PATH = '/plans/mobile-plans';
const DESKTOP = { width: 1280, height: 800 };

const dialog = (page: Page) => page.getByRole('dialog', { name: 'En desarrollo' });
const exitLink = (page: Page) => dialog(page).getByRole('link', { name: 'Volver al inicio' });

async function openRecharges(page: Page) {
  await page.goto(URL_PATH);
  await expect(dialog(page)).toBeVisible();
  // Tras hidratar, el foco va al botón.
  await expect(exitLink(page)).toBeFocused();
}

/** Las mismas comprobaciones a 360 y a 1280. */
function atBothSizes(name: string, check: (page: Page, desktop: boolean) => Promise<void>) {
  test(`${name} · 360`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'mobile-360', 'una sola vez');
    await signIn(context);
    await check(page, false);
  });
  test.describe(`${name} · 1280`, () => {
    test.use({ viewport: DESKTOP, isMobile: false, hasTouch: false });
    test('1280 × 800', async ({ page, context }, info) => {
      test.skip(info.project.name !== 'mobile-360', 'una sola vez');
      await signIn(context);
      await check(page, true);
    });
  });
}

atBothSizes('CA-4 · consumidor: aviso con el contenido desenfocado, bloqueado y sin desplazarse', async (page) => {
  await openRecharges(page);
  const notice = dialog(page);
  await expect(notice.getByRole('heading', { name: 'En desarrollo' })).toBeVisible();
  await expect(notice).toContainText('Muy pronto vas a poder recargar tu celular y contratar planes con tu saldo.');

  const content = page.locator('[data-blocked-content]');
  await expect(content).toHaveAttribute('inert', '');
  await expect(content).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveCSS('filter', /blur/);

  // Ni un clic ni un toque llegan al contenido: en tres puntos fuera de las barras, lo que hay encima es el aviso.
  const { width, height } = page.viewportSize()!;
  const points = [
    [width * 0.2, height * 0.4],
    [width * 0.5, height * 0.5],
    [width * 0.8, height * 0.6],
  ];
  for (const [x, y] of points) {
    const insideNotice = await page.evaluate(
      ([px, py]) => !!document.elementFromPoint(px, py)?.closest('[data-under-development]'),
      [x, y],
    );
    expect(insideNotice, `punto (${Math.round(x)}, ${Math.round(y)})`).toBe(true);
  }

  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

atBothSizes('CA-5 · foco en "Volver al inicio", Tab no sale, Escape y clic fuera no cierran, 44 × 44', async (page) => {
  await openRecharges(page);
  const link = exitLink(page);

  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(link).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeVisible();

  // Una esquina de la capa: fuera del panel y fuera de las barras.
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(4, height / 2);
  await page.mouse.click(width - 4, height / 2);
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${URL_PATH}$`));

  const box = await link.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  expect(box!.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX);

  await link.click();
  await expect(page).toHaveURL(/\/home$/);
});

atBothSizes('CA-4 · las barras siguen usables con el aviso abierto', async (page, desktop) => {
  await openRecharges(page);
  const home = desktop
    ? page.locator('nav a[title="Inicio"]:visible')
    : page.locator('nav[aria-label="Navegación inferior"]').getByRole('link', { name: 'Inicio', exact: true });
  await home.click();
  await expect(page).toHaveURL(/\/home$/);
});

atBothSizes('CA-4 · los accesos de Recargas (barra, tarjeta del home y pie) llevan al aviso', async (page, desktop) => {
  await page.goto('/home');
  await settle(page);
  if (desktop) {
    await page.locator('nav a[title="Recargas"]:visible').click();
  } else {
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    await page.locator('div.py-2.pb-20').getByRole('link', { name: 'Recargas', exact: true }).click();
  }
  await expect(dialog(page)).toBeVisible();

  await page.goto('/home');
  await settle(page);
  await page.locator(`main a[href="${URL_PATH}"]`).first().click();
  await expect(dialog(page)).toBeVisible();

  await page.goto('/home');
  await settle(page);
  await page.locator(`footer a[href="${URL_PATH}"]`).click();
  await expect(dialog(page)).toBeVisible();
});

for (const [role, exitHref] of [
  ['ROLE_ADMIN', '/admin'],
  ['ROLE_COMMERCIAL', '/commercial'],
] as const) {
  atBothSizes(`CA-4 · con ${role} el botón lleva a ${exitHref}`, async (page) => {
    await signIn(page.context(), role);
    await page.goto(URL_PATH);
    await expect(dialog(page)).toBeVisible();
    await expect(exitLink(page)).toHaveAttribute('href', exitHref);
  });
}

test.describe('CA-4 · visitante sin sesión', () => {
  const guest = async (page: Page) => {
    await openRecharges(page);
    await expect(dialog(page)).toContainText('Muy pronto vas a poder recargar tu celular y contratar planes con tu saldo.');
    await expect(exitLink(page)).toHaveAttribute('href', '/');
    await exitLink(page).click();
    await expect(page).toHaveURL(/\/$/);
  };

  test('360', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-360', 'una sola vez');
    await guest(page);
  });

  test.describe('1280', () => {
    test.use({ viewport: DESKTOP, isMobile: false, hasTouch: false });
    test('1280 × 800', async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile-360', 'una sola vez');
      await guest(page);
    });
  });
});

test.describe('CA-6 · el resto de /plans no tiene aviso', () => {
  for (const route of ['/plans', '/plans/checkout']) {
    test(`${route} sin diálogo "En desarrollo"`, async ({ page, context }, info) => {
      test.skip(info.project.name !== 'mobile-360', 'una sola vez');
      const entry = PANEL_PAGES.find((p) => p.route === route)!;
      await gotoPanelPage(page, context, entry);
      await settle(page);
      await expect(page.getByRole('dialog', { name: 'En desarrollo' })).toHaveCount(0);
      await expect(page.getByText('En desarrollo', { exact: true })).toHaveCount(0);
    });
  }
});
