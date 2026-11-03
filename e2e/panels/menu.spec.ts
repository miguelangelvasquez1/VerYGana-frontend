import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../support/network';
import { MIN_TOUCH_PX, settle } from '../support/measure';
import { gotoPanelPage } from '../support/panelOpen';
import { PANEL_PAGES, type PanelVariant, type TestPlan } from '../support/panelPages';

// CA-7 de la spec 014, a 360 × 740: el menú de cada panel se abre con un botón con nombre de 44 px, cada sección
// de primer nivel (D-9) se alcanza desde el cajón, elegirla navega y cierra, y `Escape` lo cierra y devuelve el
// foco al botón. Las entradas bloqueadas por el plan se ven con candado y no son enlace (D-9).

const MOBILE_360 = 'mobile-360';

interface MenuLink {
  name: string;
  href: string;
}

// Lista literal por plan (con la unión de STANDARD y PREMIUM se llega a todas las secciones del comercial).
const COMMERCIAL_MENU: Record<'STANDARD' | 'PREMIUM', { links: MenuLink[]; locked: string[] }> = {
  STANDARD: {
    links: [
      { name: 'Inicio', href: '/commercial/dashboard' },
      { name: 'Mis productos', href: '/commercial/products' },
      { name: 'Mis Anuncios', href: '/commercial/ads' },
      { name: 'Branding en Juegos', href: '/commercial/branding' },
      { name: 'Encuestas', href: '/commercial/surveys' },
      { name: 'Estadísticas', href: '/commercial/analytics' },
      { name: 'Saldo de Prosperidad', href: '/commercial/prosperity' },
      { name: 'Promociones de Llaves', href: '/commercial/key-promotions' },
      { name: 'Facturación', href: '/commercial/billing' },
      { name: 'Soporte', href: '/commercial/support' },
      // Saldo: el bloque de presupuesto del cajón (D-5).
      { name: 'Recargar', href: '/commercial/balance' },
    ],
    locked: ['Mascotas', 'Aliados'],
  },
  PREMIUM: {
    links: [
      { name: 'Inicio', href: '/commercial/dashboard' },
      { name: 'Mis Anuncios', href: '/commercial/ads' },
      { name: 'Branding en Juegos', href: '/commercial/branding' },
      { name: 'Encuestas', href: '/commercial/surveys' },
      { name: 'Mascotas', href: '/commercial/pets' },
      { name: 'Aliados', href: '/commercial/allies' },
      { name: 'Estadísticas', href: '/commercial/analytics' },
      { name: 'Saldo de Prosperidad', href: '/commercial/prosperity' },
      { name: 'Facturación', href: '/commercial/billing' },
      { name: 'Soporte', href: '/commercial/support' },
      { name: 'Recargar', href: '/commercial/balance' },
    ],
    locked: ['Mis productos'],
  },
};

/** Espera a que el cajón esté a la vista (la transición dura 300 ms). */
async function expectDrawerOpen(drawer: Locator) {
  await expect.poll(async () => (await drawer.boundingBox())?.x ?? -999).toBeGreaterThanOrEqual(-0.5);
  await expect(drawer).not.toHaveAttribute('inert', /.*/);
}

async function openMenu(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menú' });
  await menu.click();
  const drawer = page.locator('#commercial-sidebar');
  await expectDrawerOpen(drawer);
  return drawer;
}

for (const plan of ['STANDARD', 'PREMIUM'] as const satisfies readonly TestPlan[]) {
  test.describe(`@paneles · menú · comercial ${plan}`, () => {
    const entry = PANEL_PAGES.find((p) => p.route === '/commercial/dashboard');
    if (!entry) throw new Error('menu.spec.ts: /commercial/dashboard no está en panelPages.ts');
    const variant: PanelVariant = { name: `menú ${plan}`, plan };
    const { links, locked } = COMMERCIAL_MENU[plan];

    async function start(page: Page, context: Parameters<typeof gotoPanelPage>[1]) {
      test.skip(test.info().project.name !== MOBILE_360, 'el menú se mide a 360 px');
      await gotoPanelPage(page, context, entry!, { variant });
      await settle(page);
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
    }

    test('el botón de menú tiene nombre, mide 44 px y anuncia su estado', async ({ page, context }) => {
      await start(page, context);
      const menu = page.getByRole('button', { name: 'Abrir menú' });
      const box = await menu.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      // Cerrado, el cajón no está en el orden de tabulación.
      await expect(page.locator('#commercial-sidebar')).toHaveAttribute('inert', '');

      const drawer = await openMenu(page);
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      const drawerBox = await drawer.boundingBox();
      expect(drawerBox?.x).toBeGreaterThanOrEqual(-0.5);
      expect((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0)).toBeLessThanOrEqual(360.5);
      // El foco entra al cajón.
      await expect(drawer.locator('nav a[href]').first()).toBeFocused();

      // El botón de cerrar tiene nombre y mide 44 px.
      const close = drawer.getByRole('button', { name: 'Cerrar menú' });
      const closeBox = await close.boundingBox();
      expect(closeBox?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      expect(closeBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      await close.click();
      await expect(drawer).toHaveAttribute('inert', '');
      await expect(menu).toBeFocused();
    });

    test('Escape cierra el cajón y devuelve el foco al botón', async ({ page, context }) => {
      await start(page, context);
      const drawer = await openMenu(page);
      await page.keyboard.press('Escape');
      await expect(drawer).toHaveAttribute('inert', '');
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
    });

    test('cada sección de primer nivel se alcanza, mide 44 px, navega y cierra', async ({ page, context }) => {
      test.setTimeout(120_000);
      await start(page, context);

      for (const { name, href } of links) {
        const drawer = await openMenu(page);
        const link = drawer.getByRole('link', { name, exact: true });
        await expect(link, `${name} no está en el cajón`).toBeVisible();
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        expect(box?.height, `${name}: alto`).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
        expect(box?.y ?? -1, `${name}: queda a la vista`).toBeGreaterThanOrEqual(0);
        expect((box?.y ?? 9999) + (box?.height ?? 0), `${name}: queda a la vista`).toBeLessThanOrEqual(740.5);

        await link.click();
        await expect(page, `${name} navega`).toHaveURL(new RegExp(`${href}$`));
        // Al navegar, el cajón se cierra (o la página nueva monta un cajón cerrado).
        await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
        await expect(page.locator('#commercial-sidebar')).toHaveAttribute('inert', '');
      }
    });

    test('las secciones que el plan no alcanza se ven con candado y no son enlace', async ({ page, context }) => {
      await start(page, context);
      const drawer = await openMenu(page);
      // Con el plan cargado (hay al menos un enlace de la lista) las demás quedan bloqueadas.
      await expect(drawer.getByRole('link', { name: links[0].name, exact: true })).toBeVisible();
      for (const name of locked) {
        await expect(drawer.getByRole('link', { name, exact: true }), `${name} no debe ser enlace`).toHaveCount(0);
        const row = drawer.locator('[aria-disabled="true"]', { hasText: name });
        await expect(row, `${name} se ve bloqueada`).toBeVisible();
        await expect(row.locator('svg.lucide-lock'), `${name} lleva candado`).toHaveCount(1);
        const box = await row.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      }
    });

    test('Perfil se alcanza desde el avatar del encabezado', async ({ page, context }) => {
      await start(page, context);
      const profile = page.getByRole('link', { name: 'Ver mi perfil' });
      const box = await profile.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      await profile.click();
      await expect(page).toHaveURL(/\/commercial\/profile$/);
    });
  });
}

// T26 (CA-7, D-9, D-6): el menú de admin. Las dieciséis secciones de primer nivel, con "Configuración" y "Sistema"
// (D-6) y sin "Reportes" (`/admin/reports` no existe).
const ADMIN_MENU: MenuLink[] = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Usuarios', href: '/admin/users' },
  { name: 'Anuncios', href: '/admin/ads' },
  { name: 'Branding', href: '/admin/branding' },
  { name: 'Mascotas', href: '/admin/pet-requests' },
  { name: 'Productos', href: '/admin/products' },
  { name: 'Rifas', href: '/admin/raffles' },
  { name: 'Encuestas', href: '/admin/surveys' },
  { name: 'Foro', href: '/admin/forum' },
  { name: 'PQRS', href: '/admin/pqrs' },
  { name: 'Eventos de seguridad', href: '/admin/security-events' },
  { name: 'Finanzas', href: '/admin/finance' },
  { name: 'Promociones de llaves', href: '/admin/key-promotions' },
  { name: 'Reconocimientos', href: '/admin/recognitions' },
  { name: 'Configuración', href: '/admin/config' },
  { name: 'Sistema', href: '/admin/system' },
];

test.describe('@paneles · menú · admin', () => {
  const entry = PANEL_PAGES.find((p) => p.route === '/admin');
  if (!entry) throw new Error('menu.spec.ts: /admin no está en panelPages.ts');

  async function start(page: Page, context: Parameters<typeof gotoPanelPage>[1]) {
    test.skip(test.info().project.name !== MOBILE_360, 'el menú se mide a 360 px');
    await gotoPanelPage(page, context, entry!);
    await settle(page);
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  }

  async function openAdminMenu(page: Page) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const drawer = page.locator('#admin-sidebar');
    await expectDrawerOpen(drawer);
    return drawer;
  }

  test('el botón de menú tiene nombre, mide 44 px y anuncia su estado', async ({ page, context }) => {
    await start(page, context);
    const menu = page.getByRole('button', { name: 'Abrir menú' });
    const box = await menu.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#admin-sidebar')).toHaveAttribute('inert', '');

    const drawer = await openAdminMenu(page);
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox?.x).toBeGreaterThanOrEqual(-0.5);
    expect((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0)).toBeLessThanOrEqual(360.5);
    await expect(drawer.locator('nav a[href]').first()).toBeFocused();
    // En el cajón no hay botón de colapsar: solo cerrar.
    await expect(drawer.getByRole('button', { name: /Colapsar menú|Expandir menú/ })).toHaveCount(0);

    const close = drawer.getByRole('button', { name: 'Cerrar menú' });
    const closeBox = await close.boundingBox();
    expect(closeBox?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect(closeBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    await close.click();
    await expect(drawer).toHaveAttribute('inert', '');
    await expect(menu).toBeFocused();
  });

  test('Escape cierra el cajón y devuelve el foco al botón', async ({ page, context }) => {
    await start(page, context);
    const drawer = await openAdminMenu(page);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('inert', '');
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('cada sección de primer nivel se alcanza, mide 44 px, navega y cierra', async ({ page, context }) => {
    test.setTimeout(240_000);
    await start(page, context);

    // "Reportes" no existe (D-6): no hay enlace a una página que da 404.
    const first = await openAdminMenu(page);
    await expect(first.getByRole('link', { name: 'Reportes' })).toHaveCount(0);
    await expect(first.locator('a[href="/admin/reports"]')).toHaveCount(0);
    await page.keyboard.press('Escape');

    for (const { name, href } of ADMIN_MENU) {
      const drawer = await openAdminMenu(page);
      const link = drawer.getByRole('link', { name, exact: true });
      await expect(link, `${name} no está en el cajón`).toBeVisible();
      await link.scrollIntoViewIfNeeded();
      const box = await link.boundingBox();
      expect(box?.height, `${name}: alto`).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      expect(box?.y ?? -1, `${name}: queda a la vista`).toBeGreaterThanOrEqual(0);
      expect((box?.y ?? 9999) + (box?.height ?? 0), `${name}: queda a la vista`).toBeLessThanOrEqual(740.5);

      await link.click();
      await expect(page, `${name} navega`).toHaveURL(new RegExp(`${href}$`));
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
      await expect(page.locator('#admin-sidebar')).toHaveAttribute('inert', '');
    }
  });

  test('el buscador ocupa el ancho en una segunda fila y el menú de usuario mide 44 px', async ({ page, context }) => {
    await start(page, context);
    const search = page.getByRole('textbox').first();
    const searchBox = await search.boundingBox();
    expect(searchBox?.x).toBeGreaterThanOrEqual(-0.5);
    expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(360.5);
    expect(searchBox?.width ?? 0).toBeGreaterThan(280);
    const menuBox = await page.getByRole('button', { name: 'Abrir menú' }).boundingBox();
    expect(searchBox?.y ?? 0, 'el buscador va debajo de la fila del título').toBeGreaterThanOrEqual(
      (menuBox?.y ?? 0) + (menuBox?.height ?? 0) - 0.5,
    );

    const user = page.getByRole('button', { name: 'Menú de usuario' });
    const userBox = await user.boundingBox();
    expect(userBox?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect(userBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    await expect(user).toHaveAttribute('aria-expanded', 'false');
    await user.click();
    await expect(user).toHaveAttribute('aria-expanded', 'true');
    const logout = page.getByRole('button', { name: 'Cerrar Sesión' });
    const logoutBox = await logout.boundingBox();
    expect(logoutBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
  });
});

// T32 (CA-7, D-9, D-11): el menú de cumplimiento. Las cinco secciones y "Cerrar sesión" desde el cajón; el punto
// de quiebre se queda en `md` (768 px).
const COMPLIANCE_MENU: MenuLink[] = [
  { name: 'Revisión KYC', href: '/compliance/kyc' },
  { name: 'Alertas de screening', href: '/compliance/screenings' },
  { name: 'Contratos comerciales', href: '/compliance/contracts' },
  { name: 'Cambios de plan', href: '/compliance/plan-changes' },
  { name: 'Logs de auditoría', href: '/compliance/audit-logs' },
];

test.describe('@paneles · menú · cumplimiento', () => {
  const entry = PANEL_PAGES.find((p) => p.route === '/compliance/kyc');
  if (!entry) throw new Error('menu.spec.ts: /compliance/kyc no está en panelPages.ts');

  async function start(page: Page, context: Parameters<typeof gotoPanelPage>[1]) {
    test.skip(test.info().project.name !== MOBILE_360, 'el menú se mide a 360 px');
    await gotoPanelPage(page, context, entry!);
    await settle(page);
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  }

  async function openComplianceMenu(page: Page) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const drawer = page.locator('#compliance-sidebar');
    await expectDrawerOpen(drawer);
    return drawer;
  }

  test('el botón de menú tiene nombre, mide 44 px y anuncia su estado', async ({ page, context }) => {
    await start(page, context);
    const menu = page.getByRole('button', { name: 'Abrir menú' });
    const box = await menu.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toHaveAttribute('aria-controls', 'compliance-sidebar');
    await expect(page.locator('#compliance-sidebar')).toHaveAttribute('inert', '');

    const drawer = await openComplianceMenu(page);
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox?.x).toBeGreaterThanOrEqual(-0.5);
    expect((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0)).toBeLessThanOrEqual(360.5);
    await expect(drawer.locator('nav a[href]').first()).toBeFocused();

    const close = drawer.getByRole('button', { name: 'Cerrar menú' });
    const closeBox = await close.boundingBox();
    expect(closeBox?.width).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect(closeBox?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    await close.click();
    await expect(drawer).toHaveAttribute('inert', '');
    await expect(menu).toBeFocused();
  });

  test('Escape cierra el cajón y devuelve el foco al botón', async ({ page, context }) => {
    await start(page, context);
    const drawer = await openComplianceMenu(page);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('inert', '');
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('cada sección se alcanza, mide 44 px, navega y cierra; "Cerrar sesión" mide 44 px', async ({ page, context }) => {
    test.setTimeout(120_000);
    await start(page, context);

    for (const { name, href } of COMPLIANCE_MENU) {
      const drawer = await openComplianceMenu(page);
      const link = drawer.getByRole('link', { name, exact: true });
      await expect(link, `${name} no está en el cajón`).toBeVisible();
      const box = await link.boundingBox();
      expect(box?.height, `${name}: alto`).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      expect((box?.y ?? 9999) + (box?.height ?? 0), `${name}: queda a la vista`).toBeLessThanOrEqual(740.5);

      await link.click();
      await expect(page, `${name} navega`).toHaveURL(new RegExp(`${href}$`));
      await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
      await expect(page.locator('#compliance-sidebar')).toHaveAttribute('inert', '');
    }

    const drawer = await openComplianceMenu(page);
    const logout = drawer.getByRole('button', { name: 'Cerrar sesión' });
    await expect(logout).toBeVisible();
    const box = await logout.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
    expect((box?.y ?? 9999) + (box?.height ?? 0)).toBeLessThanOrEqual(740.5);
  });

  // Regresión (revisión ronda 1): `.tap-icon` fija `display` fuera de `@layer` y le ganaba a `md:hidden`; entre 768 y
  // 1023 px el botón se veía y no abría nada porque el riel fijo ya está a la vista.
  test('desde 768 px el botón de menú no se ve (el riel fijo ya está)', async ({ page, context }) => {
    await start(page, context);
    for (const width of [768, 800, 900, 1023]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(page.getByRole('button', { name: 'Abrir menú' }), `a ${width} px`).toBeHidden();
    }
    await page.setViewportSize({ width: 767, height: 800 });
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  });
});
