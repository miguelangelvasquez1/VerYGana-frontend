import { PAGES } from './support/pages';
import { expect, test } from './support/network';
import { signIn } from './support/session';

// Pruebas de humo de la infraestructura (spec 012, T6): el front de pruebas responde, la sesión simulada
// funciona y la API simulada tiene fixture para todo lo que las 30 páginas piden al cargar.

test('humo: /login abre sin sesión', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('humo: /home con sesión muestra el nombre del consumidor del fixture en la barra', async ({ page, context }) => {
  await signIn(context);
  await page.goto('/home');
  // En celular y tableta el nombre vive en el menú de perfil de la barra inferior; en escritorio, en la superior.
  const profile = page.getByRole('button', { name: 'Perfil', exact: true });
  if (await profile.isVisible()) await profile.click();
  await expect(page.getByText('Consumidor Prueba').locator('visible=true').first()).toBeVisible();
});

test('humo: las 30 páginas del alcance cargan sin pedidos sin fixture', async ({ page, context }) => {
  test.setTimeout(180_000);
  for (const entry of PAGES) {
    await context.clearCookies();
    if (entry.session) await signIn(context);
    await page.goto(entry.url);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body'), entry.route).not.toBeEmpty();
  }
});
