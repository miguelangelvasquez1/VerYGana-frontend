import { expect, test } from './support/network';
import { MOCK_API_ORIGIN } from './support/network';
import { signIn } from './support/session';

// CA-11 (spec 012, P-17): la confirmación de compra lee el id del segmento `[id]` de la ruta. Antes leía
// `purchaseId`, que no existe, y siempre mostraba "ID de compra inválido" sin pedir nada a la API.

test('CA-11 · /purchases/1/confirmation pide la compra 1 y la muestra', async ({ page, context }) => {
  await signIn(context);
  const request = page.waitForRequest(
    (req) => req.method() === 'GET' && new URL(req.url()).origin === MOCK_API_ORIGIN && new URL(req.url()).pathname.endsWith('/purchases/1'),
  );
  await page.goto('/purchases/1/confirmation');
  await request;

  await expect(page.getByRole('heading', { name: '¡Compra confirmada!' })).toBeVisible();
  await expect(page.getByText('REF-0001')).toBeVisible();
  await expect(page.getByText('Camiseta oficial')).toBeVisible();
  await expect(page.getByText('ID de compra inválido')).toHaveCount(0);
});
