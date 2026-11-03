import type { Page } from '@playwright/test';
import { ALLOWED_ORIGIN } from './mockRoutes.mjs';
import { MOCK_API_ORIGIN } from './network';
import { fakeAccessToken, TEST_EMAIL_BY_ROLE, type TestRole } from './session';

// Ayudantes para iniciar sesión en las pruebas de navegador sin salir de 127.0.0.1 (spec 014, plan 20.8).
// No cambian `LoginForm`: simulan lo que el formulario pide afuera (reCAPTCHA de Google y `POST /auth/login`).
// Todos los datos son ficticios; el token es el JWT falso de `session.ts`.

/** Sustituye el script de reCAPTCHA por uno falso: no sale ningún pedido a Google. */
export async function stubRecaptcha(page: Page) {
  await page.route('https://www.google.com/recaptcha/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: "window.grecaptcha = { ready: function (cb) { cb(); }, execute: function () { return Promise.resolve('recaptcha-ficticio'); } };",
    }),
  );
}

/** Responde `POST /auth/login` con una sesión del rol dado; el `OPTIONS` previo sigue a la API simulada. */
export async function stubLogin(page: Page, role: TestRole) {
  await page.route(`${MOCK_API_ORIGIN}/auth/login`, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Credentials': 'true' },
      body: JSON.stringify({ accessToken: fakeAccessToken(role), role }),
    });
  });
}

/** Llena el formulario del login con datos ficticios del rol y lo envía. */
export async function submitLogin(page: Page, role: TestRole) {
  await page.getByLabel('Correo electrónico o teléfono').fill(TEST_EMAIL_BY_ROLE[role]);
  await page.locator('input[name="password"]').fill('Contrasena-ficticia-1');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}
