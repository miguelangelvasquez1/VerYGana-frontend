import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from './support/network';
import { MIN_TOUCH_PX, settle } from './support/measure';
import { signIn, type TestRole } from './support/session';
import { stubLogin, stubRecaptcha, submitLogin } from './support/loginFlow';
import { guestHref } from '../src/lib/auth/returnPath';

// `/` sin sesión es el home del consumidor con accesos de visitante (spec 014, CA-1 a CA-4b; plan 20.8).
// 360, 390 y 768 corren en sus proyectos; 820, 1280 y 1440 corren dentro del proyecto `mobile-360` con otro viewport.

const LG_PX = 1024;

const EXTRA_SIZES = [
  { width: 820, height: 1180 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

type Check = (page: Page, context: BrowserContext) => Promise<void>;

/** Corre `check` en el tamaño del proyecto y en los tres tamaños extra (solo dentro de `mobile-360`). */
function atEverySize(name: string, check: Check) {
  test(`${name} · tamaño del proyecto`, async ({ page, context }) => {
    await check(page, context);
  });
  for (const size of EXTRA_SIZES) {
    test.describe(`${name} · ${size.width}`, () => {
      test.use({ viewport: size, isMobile: false, hasTouch: false });
      test(`${size.width} × ${size.height}`, async ({ page, context }, info) => {
        test.skip(info.project.name !== 'mobile-360', 'los tamaños extra corren una sola vez');
        await check(page, context);
      });
    });
  }
}

const widthOf = (page: Page) => page.viewportSize()!.width;

/** Títulos y enlaces del contenido (fuera del pie y de las barras) y enlaces visibles de las barras. */
async function collect(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => (el as HTMLElement).getClientRects().length > 0;
    const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    // La hoja de perfil del celular (`fixed`) es parte de la barra del consumidor, no del contenido.
    const inBar = (el: Element) => !!el.closest('nav, [data-app-bar], .fixed');
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .filter((el) => !el.closest('footer') && !inBar(el))
      .map(text);
    const content = Array.from(document.querySelectorAll('a'))
      .filter((el) => !el.closest('footer') && !inBar(el))
      .map((el) => ({ name: text(el), href: el.getAttribute('href') }));
    const bars = Array.from(document.querySelectorAll('a'))
      .filter((el) => el.closest('nav, [data-app-bar]') && visible(el))
      .filter((el) => el.closest('nav[aria-label="Navegación inferior"]') || el.hasAttribute('title'))
      .map((el) => ({ name: el.getAttribute('title') ?? text(el), href: el.getAttribute('href') }));
    return { headings, content, bars };
  });
}

atEverySize('CA-1 · mismo contenido que /home', async (page, context) => {
  await page.goto('/');
  await settle(page);
  const guest = await collect(page);
  const html = await page.content();
  for (const gone of ['iPhone 15 Pro', 'Créditos Gratis', '2,847 Premios', 'id="rifas"', 'id="tienda"', 'id="como-funciona"']) {
    expect(html.includes(gone), `ya no existe "${gone}"`).toBe(false);
  }

  await signIn(context);
  await page.goto('/home');
  await settle(page);
  const home = await collect(page);

  expect(guest.headings, 'títulos').toEqual(home.headings);
  expect(guest.content.map((l) => l.name), 'nombres de los enlaces').toEqual(home.content.map((l) => l.name));
});

atEverySize('CA-2 · la barra solo tiene el logo y los botones de entrada', async (page) => {
  await page.goto('/');
  await settle(page);

  // Enlaces visibles de la barra (fuera del contenido y del pie): logo, "Iniciar sesión" y "Registrarse", nada más.
  const barLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a'))
      .filter((el) => el.closest('nav, [data-app-bar]') && !el.closest('main, footer'))
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({ href: el.getAttribute('href'), name: (el.textContent ?? '').replace(/\s+/g, ' ').trim() })),
  );
  expect(barLinks.map((l) => l.href), 'enlaces de la barra').toEqual(['/', '/login', '/register']);
  expect(barLinks.slice(1).map((l) => l.name)).toEqual(['Iniciar sesión', 'Registrarse']);

  // Ningún acceso de sección en la barra (ni los de escritorio ni los de la barra inferior).
  await expect(page.locator('nav a[title]')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navegación inferior' })).toHaveCount(0);
  await expect(page.locator('[data-app-bar="bottom"]')).toHaveCount(0);

  await expect(page.getByRole('button', { name: 'Carrito de compras' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Llaves' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notificaciones' })).toHaveCount(0);
  await expect(page.getByText('Mi Perfil', { exact: true })).toHaveCount(0);

  // Sin barra inferior no queda un hueco reservado al final de la página.
  const reserved = await page.evaluate(() => getComputedStyle(document.querySelector('main')!).paddingBottom);
  expect(reserved, 'relleno inferior del contenido').toBe('0px');
});

atEverySize('CA-3 · "Iniciar sesión" y "Registrarse" a la vista', async (page) => {
  await page.goto('/');
  await settle(page);
  for (const [name, href] of [
    ['Iniciar sesión', '/login'],
    ['Registrarse', '/register'],
  ]) {
    const link = page.locator('nav, [data-app-bar="top"]').getByRole('link', { name, exact: true }).first();
    await expect(link).toBeInViewport();
    expect(await link.getAttribute('href'), name).toBe(href);
    if (widthOf(page) < LG_PX) {
      expect((await link.boundingBox())!.height, name).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
    }
  }
});

atEverySize('CA-4b · cada acceso lleva al login con su sección', async (page, context) => {
  await page.goto('/');
  await settle(page);
  const guest = await collect(page);

  await signIn(context);
  await page.goto('/home');
  await settle(page);
  const home = await collect(page);

  expect(guest.content.map((l) => l.href)).toEqual(home.content.map((l) => guestHref(l.href!)));
});

test('CA-4b · tocar la tarjeta "Sorteos", iniciar sesión y volver a /raffles', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360' || widthOf(page) !== 360, 'basta una vez, a 360');
  await stubRecaptcha(page);
  await stubLogin(page, 'ROLE_CONSUMER');
  await page.goto('/');
  await settle(page);
  // La tarjeta de Sorteos (su nombre accesible incluye la insignia y la descripción).
  await page.locator('main a[href="/login?from=%2Fraffles"]').first().click();
  await expect(page).toHaveURL(/\/login\?from=%2Fraffles$/);
  await submitLogin(page, 'ROLE_CONSUMER');
  await page.waitForURL((url) => url.pathname === '/raffles', { timeout: 15_000 });
});

const ROLE_HOME: [TestRole, RegExp][] = [
  ['ROLE_CONSUMER', /\/home$/],
  ['ROLE_COMMERCIAL', /\/commercial\/dashboard$/],
  ['ROLE_ADMIN', /\/admin$/],
  ['ROLE_COMPLIANCE_OFFICER', /\/compliance\/kyc$/],
  ['ROLE_GAME_DESIGNER', /\/game-designer$/],
];

test.describe('Landing · con sesión (CA-4)', () => {
  for (const [role, url] of ROLE_HOME) {
    test(`CA-4 · ${role} termina en su panel`, async ({ page, context }) => {
      test.skip(widthOf(page) !== 360, 'basta una vez');
      await signIn(context, role);
      await page.goto('/');
      await expect(page).toHaveURL(url);
    });
  }
});
