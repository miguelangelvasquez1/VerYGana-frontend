import { expect, test } from './support/network';
import { stubLogin, stubRecaptcha, submitLogin } from './support/loginFlow';
import { TEST_ORIGIN, type TestRole } from './support/session';

// CA-4b y CA-4c (spec 014, plan 20.8): tras el login, el consumidor vuelve a la sección guardada solo si es
// una ruta interna; cualquier otro caso va al inicio del rol y nunca sale del front.

async function loginAndLand(page: import('@playwright/test').Page, role: TestRole, search: string, expectedPath: string) {
  await stubRecaptcha(page);
  await stubLogin(page, role);
  await page.goto(`/login${search}`);
  await submitLogin(page, role);
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 15_000 });
  expect(new URL(page.url()).origin).toBe(TEST_ORIGIN);
  expect(new URL(page.url()).pathname).toBe(expectedPath);
}

test.describe('CA-4b · vuelta a la sección', () => {
  test('consumidor con from=/raffles vuelve a /raffles', async ({ page }) => {
    await loginAndLand(page, 'ROLE_CONSUMER', '?from=%2Fraffles', '/raffles');
  });

  test('con callbackUrl del mismo origen (lo que pone el middleware) vuelve a /raffles', async ({ page }) => {
    await loginAndLand(page, 'ROLE_CONSUMER', '?callbackUrl=http%3A%2F%2F127.0.0.1%3A3100%2Fraffles', '/raffles');
  });
});

test.describe('CA-4c · nunca sale del front', () => {
  for (const [name, search] of [
    ['from=//otro-sitio.test', '?from=%2F%2Fotro-sitio.test'],
    ['from=https://otro-sitio.test', '?from=https%3A%2F%2Fotro-sitio.test'],
    ['from=/login', '?from=%2Flogin'],
    ['callbackUrl de otro origen', '?callbackUrl=https%3A%2F%2Fotro-sitio.test%2Fraffles'],
  ] as const) {
    test(`consumidor con ${name} va a /home`, async ({ page }) => {
      await loginAndLand(page, 'ROLE_CONSUMER', search, '/home');
    });
  }

  test('administrador con from=/raffles va a /admin', async ({ page }) => {
    await loginAndLand(page, 'ROLE_ADMIN', '?from=%2Fraffles', '/admin');
  });
});
