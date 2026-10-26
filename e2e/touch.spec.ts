import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PAGES } from './support/pages';
import { expect, test } from './support/network';
import { settle, smallTouchTargets } from './support/measure';
import { signIn } from './support/session';

// CA-2 (spec 012): a 360 px, todo elemento interactivo visible mide al menos 44 × 44 px. Sin más excepciones
// que `iframe`, `aria-hidden` y checkbox/radio medidos por su etiqueta (D-5).

test.describe('CA-2 · áreas táctiles de 44 × 44 px', () => {
  for (const entry of PAGES) {
    test(`${entry.route}`, async ({ page, context }) => {
      if (entry.session) await signIn(context);
      await page.goto(entry.url);
      await settle(page);
      expect(await smallTouchTargets(page)).toEqual([]);
    });
  }
});

// Estados de error a 360 px: los botones "Reintentar" y "Volver" también miden 44 px.
test.describe('CA-2 · estados de error', () => {
  for (const entry of PAGES.filter((p) => p.errorApi.length > 0 || p.errorUrl)) {
    test(`${entry.route}`, async ({ page, context }) => {
      for (const pattern of entry.errorApi) {
        await page.route(pattern, (route) =>
          route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
        );
      }
      if (entry.session) await signIn(context);
      await page.goto(entry.errorUrl ?? entry.url);
      await settle(page);
      expect(await smallTouchTargets(page)).toEqual([]);
    });
  }
});

// Modales del alcance: se abren y se miden, porque la prueba de arriba solo ve el estado inicial.
test.describe('CA-2 · modales abiertos', () => {
  test('/surveys · vista previa de la encuesta', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/surveys');
    await settle(page);
    await page.getByRole('button', { name: /ver encuesta/i }).first().click();
    await expect(page.getByRole('button', { name: 'Iniciar encuesta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
    expect(await smallTouchTargets(page)).toEqual([]);
  });

  test('/surveys · paginación con varias páginas', async ({ page, context }) => {
    // El fixture normal tiene una sola página y la paginación no se pinta: este tiene tres.
    const body = readFileSync(path.join(process.cwd(), 'e2e/fixtures/api/surveys/available-paged.json'), 'utf8');
    await page.route(/\/surveys\?/, (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: {
              'access-control-allow-origin': 'http://127.0.0.1:3100',
              'access-control-allow-credentials': 'true',
            },
            body,
          })
        : route.fallback(),
    );
    await signIn(context);
    await page.goto('/surveys');
    await settle(page);
    const next = page.getByRole('button', { name: 'Página siguiente', exact: true });
    await expect(next).toBeVisible();
    await expect(page.getByRole('button', { name: 'Página anterior', exact: true })).toBeVisible();
    expect(await smallTouchTargets(page)).toEqual([]);
  });

  test('/support · detalle de la solicitud', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/support');
    await settle(page);
    await page.getByRole('button', { name: /consulta sobre mi compra/i }).click();
    await expect(page.getByRole('heading', { name: 'Detalle de la solicitud' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
    expect(await smallTouchTargets(page)).toEqual([]);
  });

  test('/explore/profile/edit · selector de avatar', async ({ page, context }) => {
    await signIn(context);
    await page.goto('/explore/profile/edit');
    await settle(page);
    await page.getByRole('button', { name: 'Cambiar avatar' }).first().click();
    await expect(page.getByRole('heading', { name: 'Cambiar avatar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
    expect(await smallTouchTargets(page)).toEqual([]);
  });

  test('/support · evidencia con la subida fallida', async ({ page, context }) => {
    // Sin red real: el permiso de subida responde 500 y el archivo queda en error, con "Reintentar subida"
    // y "Quitar archivo" sobre la misma miniatura.
    await page.route('**/pqrs/assets/prepare-upload', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error simulado"}' }),
    );
    await signIn(context);
    await page.goto('/support');
    await settle(page);
    await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).first().click();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    await page.locator('input[type="file"]').setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
    const retry = page.getByRole('button', { name: 'Reintentar subida', exact: true });
    const remove = page.getByRole('button', { name: 'Quitar archivo', exact: true });
    await expect(retry).toBeVisible();
    await expect(remove).toBeVisible();

    for (const button of [retry, remove]) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(43.5);
      expect(box?.height).toBeGreaterThanOrEqual(43.5);
      // El centro de cada botón debe pertenecerle: si otro lo cubre, tocarlo activa el equivocado.
      const hit = await button.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return top?.closest('button') === el;
      });
      expect(hit).toBe(true);
    }
    expect(await smallTouchTargets(page)).toEqual([]);
  });
});
