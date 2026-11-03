import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { settle } from './support/measure';
import { signIn } from './support/session';

// La hoja del menú de perfil del celular (las demás copias de estos enlaces están en el pie y en el menú de escritorio).
const profileMenu = (page: Page) => page.locator('div.py-2.pb-20');

const PROFILE_MENU_LINKS: [string, string][] = [
  ['Mi Nivel', '/explore/gamification'],
  ['Mi Perfil', '/explore/profile'],
  ['Mis compras', '/explore/purchases'],
  ['Mis favoritos', '/explore/favorites'],
  ['Mis participaciones', '/explore/participations'],
  ['Mis Referidos', '/explore/referrals'],
  ['Juegos', '/games'],
  ['Sorteos', '/raffles'],
  ['Encuestas', '/surveys'],
  ['Recargas', '/plans/mobile-plans'],
  ['Foro', '/forum'],
  ['Soporte', '/support'],
];

// Enlaces del pie que piden sesión (D-12): un visitante no los ve.
const FOOTER_SESSION_HREFS = ['/raffles', '/products', '/plans/mobile-plans', '/ads', '/forum'];
const GUEST_FOOTER_PAGES = ['/', '/login', '/register', '/verify?email=consumidor%40example.test', '/forgot-password', '/unlock-account'];

// RN-4 (spec 012): ningún botón muerto. Las pruebas de la landing morada se quitaron (spec 014, T44): `/` es ahora
// el home del consumidor con accesos de visitante y lo cubre `landing.spec.ts`.

test.describe('RN-4 · con sesión', () => {
  test('fila 1: "Participar ahora" no existe en el detalle del sorteo', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/raffles/1');
    await settle(page);
    await expect(page.getByRole('button', { name: /participar ahora/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /participar ahora/i })).toHaveCount(0);
  });

  test('filas 10 y 11: no hay "Llamar Ahora" ni "Chat en Vivo" en planes móviles', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/plans/mobile-plans');
    await settle(page);
    await expect(page.getByText('Llamar Ahora')).toHaveCount(0);
    await expect(page.getByText('Chat en Vivo')).toHaveCount(0);
  });

  test('filas 12 y 13: los planes y las recargas dicen "Próximamente", deshabilitados y sin parecer tocables', async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto('/plans/mobile-plans');
    await settle(page);
    const blocked = page.locator('[data-blocked-content]');
    await expect(blocked.getByText('Contratar Plan')).toHaveCount(0);
    await expect(blocked.getByText('Recargar Ahora')).toHaveCount(0);
    const soon = page.getByRole('button', { name: 'Próximamente', exact: true, includeHidden: true });
    expect(await soon.count()).toBeGreaterThan(0);
    for (const button of await soon.all()) {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).toHaveCSS('cursor', 'default');
    }
  });

  test('fila 14 y N-2 (D-9): el lateral de anuncios no tiene redes ni tarjeta de tiendas', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/ads');
    await settle(page);
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    await expect(page.getByText(/App Store|Google Play/)).toHaveCount(0);
  });

  test('N-3 (D-10): "Mis compras" del menú de perfil lleva a /explore/purchases', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/home');
    await settle(page);
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    const link = profileMenu(page).getByRole('link', { name: 'Mis compras', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/explore/purchases');
    await link.click();
    await expect(page).toHaveURL(/\/explore\/purchases$/);
  });

  test('D-13: el menú de perfil del celular tiene las páginas que la barra inferior no alcanza', async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto('/home');
    await settle(page);
    await page.getByRole('button', { name: 'Perfil', exact: true }).click();
    for (const [label, href] of PROFILE_MENU_LINKS) {
      const link = profileMenu(page).getByRole('link', { name: label, exact: true });
      await expect(link, `enlace "${label}"`).toBeVisible();
      await expect(link, `destino de "${label}"`).toHaveAttribute('href', href);
    }
  });

  test('D-12: con sesión el pie conserva los enlaces a las páginas protegidas', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/home');
    await settle(page);
    const footer = page.locator('footer');
    for (const href of FOOTER_SESSION_HREFS) {
      await expect(footer.locator(`a[href="${href}"]`), href).toHaveCount(1);
    }
  });
});

test.describe('RN-4 · páginas sin sesión', () => {
  test('N-4 (D-11): el pie de /login no tiene "Privacidad" ni "Ayuda", y "Términos" sí', async ({ page }) => {
    await page.goto('/login');
    await settle(page);
    await expect(page.getByText('Privacidad')).toHaveCount(0);
    await expect(page.getByText('Ayuda', { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href="/privacidad"], a[href="/ayuda"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Términos', exact: true })).toHaveAttribute('href', '/terminos');
  });

  for (const url of GUEST_FOOTER_PAGES) {
    test(`D-12: el pie de ${url} no enlaza a páginas con sesión ni muestra teléfono`, async ({ page }) => {
      await page.goto(url);
      await settle(page);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      for (const href of FOOTER_SESSION_HREFS) {
        await expect(footer.locator(`a[href="${href}"]`), href).toHaveCount(0);
      }
      await expect(footer.getByText(/\+57|\(601\)/)).toHaveCount(0);
      await expect(footer.locator('a[href="/"]')).toHaveCount(1);
    });
  }
});
