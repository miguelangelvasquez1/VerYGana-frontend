import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/network';
import { settle } from './support/measure';
import { signIn } from './support/session';

// CA-6 (spec 012), parte automática: en login, registro, verificación, perfil, checkout y soporte, cada campo
// tiene el teclado que le corresponde (`type`, `inputMode`, `autoComplete`) y una letra de al menos 16 px a
// 360 px, para que iOS no haga zoom al enfocarlo. Que el teclado aparezca y el campo quede visible encima de
// él va a la pasada manual (CA-10).

const MIN_FONT_PX = 16;

interface FieldInfo {
  tag: string;
  type: string;
  inputMode: string;
  autoComplete: string;
  name: string;
  fontSize: number;
}

async function fields(scope: Locator): Promise<FieldInfo[]> {
  return scope.locator('input, textarea, select').evaluateAll((els) =>
    els
      .filter((el) => {
        const input = el as HTMLInputElement;
        const rect = el.getBoundingClientRect();
        return !['hidden', 'checkbox', 'radio', 'range'].includes(input.type) && rect.width > 0 && rect.height > 0;
      })
      .map((el) => {
        const input = el as HTMLInputElement;
        return {
          tag: el.tagName.toLowerCase(),
          type: input.type,
          inputMode: input.inputMode,
          autoComplete: input.autocomplete,
          name: input.name || input.id || input.placeholder || '(sin nombre)',
          fontSize: parseFloat(getComputedStyle(el).fontSize),
        };
      }),
  );
}

function byName(list: FieldInfo[], name: string): FieldInfo {
  const found = list.find((f) => f.name === name);
  if (!found) throw new Error(`No hay un campo "${name}"; hay: ${list.map((f) => f.name).join(', ')}`);
  return found;
}

function expectReadableFonts(list: FieldInfo[]) {
  const small = list.filter((f) => f.fontSize < MIN_FONT_PX).map((f) => `${f.name} ${f.fontSize}px`);
  expect(small, `campos con letra de menos de ${MIN_FONT_PX} px`).toEqual([]);
}

async function open(page: Page, url: string) {
  await page.goto(url);
  await settle(page);
}

test.use({ viewport: { width: 360, height: 740 } });

test('CA-6 · login', async ({ page }) => {
  await open(page, '/login');
  const list = await fields(page.locator('form'));
  expect(byName(list, 'identifier').inputMode).toBe('email');
  expect(byName(list, 'identifier').autoComplete).toBe('username');
  expect(byName(list, 'password').autoComplete).toBe('current-password');
  expectReadableFonts(list);
});

test('CA-6 · registro de beneficiario', async ({ page }) => {
  await open(page, '/register');
  await page.getByRole('button', { name: /Soy Beneficiario/ }).click();
  await expect(page.getByText('Información personal')).toBeVisible();
  const list = await fields(page.locator('form'));
  expect(byName(list, 'email').type).toBe('email');
  expect(byName(list, 'email').autoComplete).toBe('email');
  expect(byName(list, 'documentNumber').inputMode).toBe('numeric');
  expect(byName(list, '300 000 0000').type).toBe('tel');
  expect(byName(list, '300 000 0000').inputMode).toBe('numeric');
  expect(byName(list, 'password').autoComplete).toBe('new-password');
  expectReadableFonts(list);
});

test('CA-6 · verificación', async ({ page }) => {
  await open(page, '/verify?email=consumidor%40example.test');
  const list = await fields(page.locator('main, body').first());
  const digits = list.filter((f) => f.inputMode === 'numeric');
  expect(digits).toHaveLength(6);
  expect(digits[0].autoComplete).toBe('one-time-code');
  expectReadableFonts(list);
});

test('CA-6 · perfil (editar)', async ({ page, context }) => {
  await signIn(context);
  await open(page, '/explore/profile/edit');
  const list = await fields(page.locator('form'));
  const email = list.find((f) => f.type === 'email');
  expect(email, 'campo de correo').toBeDefined();
  expect(email?.autoComplete).toBe('email');
  expect(list.find((f) => f.type === 'tel'), 'campo de teléfono').toBeDefined();
  expectReadableFonts(list);
});

test('CA-6 · checkout', async ({ page, context }) => {
  await signIn(context);
  // El carrito vive en localStorage (CartService): se siembra con un producto con llaves antes de cargar.
  await page.addInitScript(() => {
    localStorage.setItem(
      'shopping_cart',
      JSON.stringify([
        {
          productId: 1,
          name: 'Producto de prueba',
          imageUrl: '/logos/logo.png',
          price: 125000,
          maxKeysAllowed: 10,
          minCashCents: 0,
          quantity: 2,
          stock: 5,
          categoryName: 'Categoría de prueba',
        },
      ]),
    );
  });
  await open(page, '/checkout');
  const list = await fields(page.locator('form'));
  const email = list.find((f) => f.type === 'email');
  expect(email, 'campo de correo de entrega').toBeDefined();
  expect(email?.autoComplete).toBe('email');
  const keys = list.find((f) => f.type === 'number');
  expect(keys, 'campo de llaves').toBeDefined();
  expect(keys?.inputMode).toBe('numeric');
  expectReadableFonts(list);
});

test('CA-6 · soporte (nueva solicitud)', async ({ page, context }) => {
  await signIn(context);
  await open(page, '/support');
  await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click();
  const dialog = page.locator('div.fixed', { has: page.getByRole('heading', { name: 'Nueva solicitud de PQRS' }) });
  await expect(dialog).toBeVisible();
  const list = await fields(dialog);
  expect(list.length).toBeGreaterThanOrEqual(3);
  expectReadableFonts(list);
});
