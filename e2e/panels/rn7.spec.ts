import { expect, test } from '../support/network';
import { MIN_TOUCH_PX, settle } from '../support/measure';
import { gotoPanelPage } from '../support/panelOpen';
import { PANEL_PAGES } from '../support/panelPages';

// RN-7 de la spec 014, con las decisiones de D-6 (2026-11-01) para admin: un botón sin acción se conecta a su
// destino, se oculta o queda como "Próximamente". Se mide a 360 px.

const MOBILE_360 = 'mobile-360';

function entryOf(route: string) {
  const entry = PANEL_PAGES.find((p) => p.route === route);
  if (!entry) throw new Error(`rn7.spec.ts: ${route} no está en panelPages.ts`);
  return entry;
}

test.describe('@paneles · RN-7 · dashboard de admin', () => {
  const CONNECTED = [
    { name: /Ver todas las rifas/, href: '/admin/raffles' },
    { name: /Nueva Rifa/, href: '/admin/raffles' },
    { name: /Gestionar Usuarios/, href: '/admin/users' },
    { name: /^Configuración Ajustes del sistema/, href: '/admin/config' },
  ];

  test('los botones con destino son enlaces que navegan', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'se mide a 360 px');
    test.setTimeout(90_000);
    for (const { name, href } of CONNECTED) {
      await gotoPanelPage(page, context, entryOf('/admin'));
      await settle(page);
      const link = page.locator('main').getByRole('link', { name });
      await expect(link, `${name} debe ser un enlace`).toHaveAttribute('href', href);
      const box = await link.boundingBox();
      expect(box?.height, `${name}: alto`).toBeGreaterThanOrEqual(MIN_TOUCH_PX - 0.5);
      await link.click();
      await expect(page, `${name} navega`).toHaveURL(new RegExp(`${href}$`));
    }
  });

  test('"Ver toda la actividad" y "Ver Reportes" no existen', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'se mide a 360 px');
    await gotoPanelPage(page, context, entryOf('/admin'));
    await settle(page);
    await expect(page.getByText('Actividad Reciente')).toBeVisible();
    await expect(page.getByText(/Ver toda la actividad/)).toHaveCount(0);
    await expect(page.getByText(/Ver Reportes/)).toHaveCount(0);
  });
});

test.describe('@paneles · RN-7 · sistema de admin', () => {
  test('los seis botones son "Próximamente": deshabilitados, con aria-disabled y sin cursor ni hover', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'se mide a 360 px');
    await gotoPanelPage(page, context, entryOf('/admin/system'));
    await settle(page);
    await expect(page.getByText('Módulos del Sistema')).toBeVisible();

    const soon = page.locator('main button[aria-disabled="true"]');
    await expect(soon).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      const button = soon.nth(i);
      await expect(button).toBeDisabled();
      await expect(button.getByText('Próximamente', { exact: true })).toBeVisible();
      expect(await button.evaluate((el) => getComputedStyle(el).cursor), `botón ${i}: cursor`).not.toBe('pointer');
      expect(await button.evaluate((el) => el.className), `botón ${i}: estilos de hover`).not.toMatch(/hover:/);
    }
    for (const name of ['Modo Mantenimiento', 'Configuración Avanzada', 'Reiniciar Servicios', 'Backup Completo', 'Limpiar Cache']) {
      await expect(page.locator('main button[aria-disabled="true"]', { hasText: name }).first()).toBeVisible();
    }
  });
});
