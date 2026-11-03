import type { Page } from '@playwright/test';
import { expect, test } from '../support/network';
import { ALLOWED_ORIGIN } from '../support/mockRoutes.mjs';
import { gotoPanelPage } from '../support/panelOpen';
import { PANEL_PAGES } from '../support/panelPages';
import { settle, smallTouchTargets } from '../support/measure';

// CA-10 de la spec 014, parte automática, a 360 px: en los formularios de los paneles que se abren con
// fixtures, cada campo de texto mide 16 px o más (iOS hace zoom con menos) y los campos que lo piden llevan el
// `type`, `inputMode` y `autoComplete` esperados. Que aparezca el teclado y que el campo quede visible encima
// va a la pasada manual (CA-13). Los casos por campo los agregan las tareas de cada panel (T14, T21, ...).

const MIN_FONT_PX = 16;

/** Páginas con formularios abiertos al cargar. Los de los modales se miden en `modals.spec.ts`. */
const FORM_PAGES = [
  '/forgot-password',
  '/unlock-account',
  '/commercial/profile/edit',
  '/commercial/ads/create',
  '/commercial/surveys/new',
  '/commercial/products/create',
  '/commercial/support',
  '/admin/recognitions/new',
];

/** Atributos esperados de campos concretos, por página: se agregan en las tareas de cada panel. */
const EXPECTED_ATTRIBUTES: Record<string, { selector: string; type?: string; inputMode?: string; autoComplete?: string }[]> = {
  '/forgot-password': [{ selector: 'input[type="email"]', type: 'email', autoComplete: 'email' }],
  // T25: el correo, el teléfono (`tel`) y la dirección piden el teclado y el autocompletado de su dato.
  '/commercial/profile/edit': [
    { selector: 'input[type="email"]', type: 'email', inputMode: 'email', autoComplete: 'email' },
    { selector: 'input[maxlength="15"]', type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
    { selector: 'input[maxlength="300"]', autoComplete: 'street-address' },
  ],
  '/unlock-account': [
    { selector: '#identifier', inputMode: 'email', autoComplete: 'username' },
    { selector: '#code', inputMode: 'numeric', autoComplete: 'one-time-code' },
  ],
};

test.describe('@paneles · formularios', () => {
  for (const route of FORM_PAGES) {
    const entry = PANEL_PAGES.find((p) => p.route === route);
    if (!entry) throw new Error(`forms.spec.ts: la página ${route} no está en panelPages.ts`);

    test(`${route} · campos de 16 px`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');

      await gotoPanelPage(page, context, entry);
      await settle(page);

      const small = await page.evaluate((min) => {
        const out: string[] = [];
        const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="submit"]), select, textarea');
        for (const el of Array.from(fields)) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size < min) {
            const name = el.getAttribute('aria-label') ?? el.getAttribute('name') ?? el.getAttribute('placeholder') ?? el.tagName.toLowerCase();
            out.push(`${el.tagName.toLowerCase()} "${name}" ${size}px`);
          }
        }
        return out;
      }, MIN_FONT_PX);
      expect(small, `${route}: campos de menos de ${MIN_FONT_PX}px`).toEqual([]);

      for (const expected of EXPECTED_ATTRIBUTES[route] ?? []) {
        const field = page.locator(expected.selector).first();
        if (expected.type) await expect(field).toHaveAttribute('type', expected.type);
        if (expected.inputMode) await expect(field).toHaveAttribute('inputmode', expected.inputMode);
        if (expected.autoComplete) await expect(field).toHaveAttribute('autocomplete', expected.autoComplete);
      }
    });
  }
});

// T14: el paso del código y de la contraseña nueva de /forgot-password no se ve al cargar: se llega a él con el
// POST de "enviar código" simulado. Ningún dato es real.
test.describe('@paneles · recuperar contraseña', () => {
  test('paso del código: OTP numérico, contraseñas nuevas y campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    const entry = PANEL_PAGES.find((p) => p.route === '/forgot-password');
    if (!entry) throw new Error('forms.spec.ts: /forgot-password no está en panelPages.ts');

    await page.route('**/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Credentials': 'true' },
        body: '{}',
      }),
    );
    await gotoPanelPage(page, context, entry);
    await settle(page);
    await page.locator('input[type="email"]').fill('consumidor@example.test');
    await page.getByRole('button', { name: 'Enviar código de recuperación' }).click();

    const otp = page.locator('input[inputmode="numeric"]');
    await expect(otp).toHaveCount(6);
    await expect(otp.first()).toHaveAttribute('autocomplete', 'one-time-code');
    for (let i = 0; i < 6; i++) await otp.nth(i).fill(String(i + 1));
    await page.getByRole('button', { name: 'Continuar' }).click();

    const passwords = page.locator('input[autocomplete="new-password"]');
    await expect(passwords).toHaveCount(2);
    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input[autocomplete="new-password"]')).map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
    expect(sizes.every((size) => size >= MIN_FONT_PX), `tamaños de letra ${sizes.join(', ')}`).toBe(true);
    expect(await smallTouchTargets(page)).toEqual([]);
  });
});

test.describe('@paneles · desbloquear cuenta', () => {
  test('el identificador, el código y los botones cumplen CA-10 y CA-6', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    const entry = PANEL_PAGES.find((p) => p.route === '/unlock-account');
    if (!entry) throw new Error('forms.spec.ts: /unlock-account no está en panelPages.ts');
    await gotoPanelPage(page, context, entry);
    await settle(page);
    await expect(page.locator('#identifier')).toHaveAttribute('inputmode', 'email');
    await expect(page.locator('#code')).toHaveAttribute('autocomplete', 'one-time-code');
    expect(await smallTouchTargets(page)).toEqual([]);
  });
});

// T18 (RN-3, D-3 = b): la clase `.panel-touch` de los layouts de panel sube los campos a 16 px solo por debajo de
// `lg`; a 1280 px los campos conservan el tamaño de siempre (el escritorio no cambia). Se prueba en una página
// con campos al cargar de cada layout que tiene formularios (`/commercial/ads/create` abre con un selector de
// archivo y sin campos de texto: sus campos aparecen en los pasos 2 y 3, que necesitan un archivo subido).
const DESKTOP_FIELD_SIZES: Record<string, number[]> = {
  // Tamaños de letra de los campos visibles a 1280 px, medidos antes de la regla.
  '/commercial/products/create': [16, 16, 16, 16, 16, 14, 16, 16, 16],
  '/admin/recognitions/new': [14, 14, 14, 14],
};

async function fieldFontSizes(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="submit"]), select, textarea');
    return Array.from(fields)
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => parseFloat(getComputedStyle(el).fontSize));
  });
}

test.describe('@paneles · .panel-touch', () => {
  for (const route of Object.keys(DESKTOP_FIELD_SIZES)) {
    const entry = PANEL_PAGES.find((p) => p.route === route);
    if (!entry) throw new Error(`forms.spec.ts: la página ${route} no está en panelPages.ts`);

    test(`${route} · a 360 px todos los campos miden 16 px o más`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
      await gotoPanelPage(page, context, entry);
      await settle(page);
      const sizes = await fieldFontSizes(page);
      expect(sizes.length, 'la página debe tener campos visibles').toBeGreaterThan(0);
      expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
    });

    test(`${route} · a 1280 px los campos conservan su tamaño`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'se mide en el proyecto de celular con el viewport ampliado');
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoPanelPage(page, context, entry);
      await settle(page);
      const sizes = await fieldFontSizes(page);
      expect(sizes).toEqual(DESKTOP_FIELD_SIZES[route]);
    });
  }
});

// T15: pasos del onboarding comercial con campos. El paso 5 (documentos) solo tiene selectores de archivo y no
// lleva campos de texto; sus botones se miden en `layout.spec.ts`.
test.describe('@paneles · onboarding comercial', () => {
  const entry = PANEL_PAGES.find((p) => p.route === '/commercial-onboarding');
  if (!entry) throw new Error('forms.spec.ts: /commercial-onboarding no está en panelPages.ts');
  const variantOf = (name: string) => {
    const found = entry.variants?.find((v) => v.name === name);
    if (!found) throw new Error(`forms.spec.ts: falta la variante "${name}" de /commercial-onboarding`);
    return found;
  };

  test('paso 2 · identificación legal: teclados y campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, entry, { variant: variantOf('paso 2 · identificación legal') });
    await expect(page.getByText('Identificación legal').first()).toBeVisible({ timeout: 15_000 });
    await settle(page);

    await expect(page.getByPlaceholder('900.000.000-0')).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByPlaceholder('1234567890')).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByPlaceholder('Nombre de la empresa')).toHaveAttribute('autocomplete', 'organization');
    await expect(page.getByPlaceholder('Ej. Calle 10 # 20-30')).toHaveAttribute('autocomplete', 'street-address');

    const sizes = await fieldFontSizes(page);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
  });

  test('paso 3 · diagnóstico: campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, entry, { variant: variantOf('paso 3 · diagnóstico') });
    // La acción de apertura del cuestionario del fixture (cualquiera que no sea de modalidades ni de salida).
    const start = page.getByRole('button', { name: 'Responde con calma' });
    await expect(start).toBeVisible({ timeout: 15_000 });
    await settle(page);
    await start.click();
    await page.waitForTimeout(500);

    const sizes = await fieldFontSizes(page);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
    for (const field of await page.locator('input[inputmode="numeric"]').all()) {
      expect(await field.getAttribute('type')).toBe('text');
    }
  });
});

// T21 y T22 (CA-10): atributos de los campos de anuncios, encuestas y productos, y las ayudas "?" que abren con el
// toque. El formulario de crear anuncio muestra sus campos solo después de subir y analizar un archivo (pasos 2 y
// 3, que necesitan la subida a R2): sus atributos se miden en el modal de editar anuncio, que usa los mismos, y la
// pasada manual de CA-13 cubre el paso a paso de crear.
test.describe('@paneles · anuncios, encuestas y productos', () => {
  const pageOf = (route: string) => {
    const entry = PANEL_PAGES.find((p) => p.route === route);
    if (!entry) throw new Error(`forms.spec.ts: la página ${route} no está en panelPages.ts`);
    return entry;
  };
  const numericFields = async (page: Page, scope = 'body') =>
    page.evaluate((root) => {
      const container = document.querySelector(root) ?? document.body;
      return Array.from(container.querySelectorAll('input[type="number"]'))
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => el.getAttribute('inputmode'));
    }, scope);

  test('crear encuesta: cantidades y edades con teclado numérico', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/surveys/new'));
    await settle(page);
    const modes = await numericFields(page);
    expect(modes.length, 'la página debe tener campos numéricos').toBeGreaterThan(0);
    expect(modes.every((mode) => mode === 'numeric'), `inputmode de los campos numéricos: ${modes.join(', ')}`).toBe(true);
  });

  test('crear producto: el precio abre el teclado decimal', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/products/create'));
    await settle(page);
    await expect(page.locator('input[name="price"]')).toHaveAttribute('inputmode', 'decimal');
  });

  test('editar producto: el precio abre el teclado decimal', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/products/edit/[productId]'));
    await expect(page.locator('input[name="price"]')).toBeVisible({ timeout: 15_000 });
    await settle(page);
    await expect(page.locator('input[name="price"]')).toHaveAttribute('inputmode', 'decimal');
  });

  test('editar anuncio: URL de destino de tipo url, edades numéricas y campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/ads'));
    await settle(page);
    await page.getByRole('button', { name: 'Editar', exact: true, disabled: false }).first().click();
    await expect(page.getByRole('heading', { name: 'Editar Anuncio' })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.locator('input[type="url"]').first()).toBeVisible();
    const modes = await numericFields(page);
    expect(modes.length).toBeGreaterThan(0);
    expect(modes.every((mode) => mode === 'numeric'), `inputmode de las edades: ${modes.join(', ')}`).toBe(true);
    const sizes = await fieldFontSizes(page);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
  });

  test('editar encuesta: edades numéricas y campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/surveys'));
    await settle(page);
    await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
    await page.getByRole('button', { name: 'Editar encuesta' }).click();
    await expect(page.getByRole('heading', { name: 'Editar encuesta' })).toBeVisible();
    await page.waitForTimeout(500);
    const modes = await numericFields(page);
    expect(modes.length).toBeGreaterThan(0);
    expect(modes.every((mode) => mode === 'numeric'), `inputmode de las edades: ${modes.join(', ')}`).toBe(true);
    const sizes = await fieldFontSizes(page);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
  });

  // RN-2: una ayuda "?" que solo respondía al puntero. Con el dedo, el navegador manda `mouseenter` justo antes del
  // `click`: si ambos alternaran el estado, la ayuda se abriría y se cerraría en el mismo toque.
  test('las ayudas "?" abren con un toque, cierran con otro y con un toque fuera', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'las ayudas se prueban con el dedo a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/surveys/new'));
    await settle(page);
    const help = page.getByRole('button', { name: /^Ayuda para:/ }).first();
    await help.scrollIntoViewIfNeeded();
    const box = await help.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(43.5);
    expect(box?.height).toBeGreaterThanOrEqual(43.5);

    await help.tap();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await expect(help).toHaveAttribute('aria-expanded', 'true');
    await help.tap();
    await expect(page.getByRole('tooltip')).toBeHidden();

    await help.tap();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.getByRole('heading').first().tap();
    await expect(page.getByRole('tooltip')).toBeHidden();
  });
});

// T23 (RN-2): el "?" del estado de una solicitud de branding y de una campaña abre y cierra con el toque, y mide
// 44 px de área.
test.describe('@paneles · branding', () => {
  for (const route of ['/commercial/branding/requests/[id]', '/commercial/branding/campaigns/[id]']) {
    test(`${route} · el "?" del estado abre con un toque y cierra con otro`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'las ayudas se prueban con el dedo a 360 px');
      const entry = PANEL_PAGES.find((p) => p.route === route);
      if (!entry) throw new Error(`forms.spec.ts: la página ${route} no está en panelPages.ts`);
      await gotoPanelPage(page, context, entry);
      await settle(page);
      const help = page.getByRole('button', { name: /^Qué significa el estado/ });
      // La ayuda se carga aparte: hasta que llega solo se ve el círculo.
      await expect(help).toBeVisible({ timeout: 15_000 });
      const box = await help.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(43.5);
      expect(box?.height).toBeGreaterThanOrEqual(43.5);

      await help.tap();
      await expect(page.getByRole('tooltip')).toBeVisible();
      await expect(help).toHaveAttribute('aria-expanded', 'true');
      await help.tap();
      await expect(page.getByRole('tooltip')).toBeHidden();
    });
  }
});

// T25 (CA-10): método de pago (cuenta y documento numéricos, OTP de un solo uso) y nueva solicitud de soporte. Los
// valores son ficticios y no se escriben en ningún campo (P-16).
test.describe('@paneles · método de pago y soporte', () => {
  const pageOf = (route: string) => {
    const entry = PANEL_PAGES.find((p) => p.route === route);
    if (!entry) throw new Error(`forms.spec.ts: la página ${route} no está en panelPages.ts`);
    return entry;
  };

  test('crear método de pago: cuenta y documento numéricos y campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/billing'));
    await settle(page);
    await page.getByRole('button', { name: 'Agregar método de pago', exact: true }).first().click();
    await expect(page.locator('input[name="alias"]')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator('input[name="accountNumber"]')).toHaveAttribute('inputmode', 'numeric');
    await expect(page.locator('input[name="accountHolderDoc"]')).toHaveAttribute('inputmode', 'numeric');
    const sizes = await fieldFontSizes(page);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
  });

  test('verificar método de pago: el código es numérico y de un solo uso', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/billing'));
    await settle(page);
    await page.getByRole('button', { name: 'Verificar código', exact: true }).first().click();
    const code = page.getByPlaceholder('Ej. 123456');
    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute('inputmode', 'numeric');
    await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  });

  test('nueva solicitud de soporte: campos de 16 px', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
    await gotoPanelPage(page, context, pageOf('/commercial/support'));
    await settle(page);
    await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click();
    await expect(page.getByPlaceholder('Cuéntanos con detalle qué sucedió...')).toBeVisible();
    const sizes = await fieldFontSizes(page);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
  });
});

// T28 (CA-10): los modales de usuarios de admin. Correo con teclado de correo, teléfono con teclado de teléfono,
// contraseña nueva con su autocompletado y campos de 16 px. Son datos de otra persona: `autocomplete="off"` para
// que el navegador no ponga los del administrador. Valores ficticios y sin escribir nada (P-16).
test.describe('@paneles · admin · usuarios · formularios', () => {
  const users = () => {
    const entry = PANEL_PAGES.find((p) => p.route === '/admin/users');
    if (!entry) throw new Error('forms.spec.ts: /admin/users no está en panelPages.ts');
    return entry;
  };

  const CASES: { name: string; open: string; fields: { selector: string; type?: string; inputMode?: string; autoComplete?: string }[] }[] = [
    {
      name: 'registrar Game Designer',
      open: 'Registrar Game Designer',
      fields: [
        { selector: 'input[type="email"]', type: 'email', inputMode: 'email', autoComplete: 'off' },
        { selector: 'input[type="tel"]', type: 'tel', inputMode: 'tel', autoComplete: 'off' },
      ],
    },
    {
      name: 'registrar Oficial de Cumplimiento',
      open: 'Registrar Oficial de Cumplimiento',
      fields: [
        { selector: 'input[type="email"]', type: 'email', inputMode: 'email', autoComplete: 'off' },
        { selector: 'input[type="tel"]', type: 'tel', inputMode: 'tel', autoComplete: 'off' },
        { selector: 'input[type="password"]', autoComplete: 'new-password' },
      ],
    },
    {
      name: 'editar usuario',
      open: 'Editar',
      fields: [
        { selector: 'input[type="email"]', type: 'email', inputMode: 'email', autoComplete: 'off' },
        { selector: 'input[type="tel"]', type: 'tel', inputMode: 'tel', autoComplete: 'off' },
      ],
    },
    { name: 'notificar usuario', open: 'Enviar notificación', fields: [] },
  ];

  for (const { name, open, fields } of CASES) {
    test(`admin · usuarios · ${name}: atributos y campos de 16 px`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
      await gotoPanelPage(page, context, users());
      await settle(page);
      await page.getByRole('button', { name: open, exact: true, disabled: false }).first().click();
      await page.waitForTimeout(500);
      const dialog = page.locator('div.fixed.inset-0').last();
      for (const expected of fields) {
        const field = dialog.locator(expected.selector).first();
        await expect(field).toBeVisible();
        if (expected.type) await expect(field).toHaveAttribute('type', expected.type);
        if (expected.inputMode) await expect(field).toHaveAttribute('inputmode', expected.inputMode);
        if (expected.autoComplete) await expect(field).toHaveAttribute('autocomplete', expected.autoComplete);
      }
      const sizes = await fieldFontSizes(page);
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
    });
  }
});

// T30 y T31 (CA-10): formularios de admin que se abren con un clic. Cantidades con teclado numérico, montos con teclado
// decimal, fechas con su tipo y campos de 16 px. Sin escribir nada (P-16). El selector de fechas del sorteo
// (react-datepicker) es un campo de texto propio: lleva `autocomplete="off"`; el paso 2 del asistente de
// reconocimientos (cantidad) necesita elegir un beneficiario y un producto y queda para la pasada manual.
test.describe('@paneles · admin · formularios de T30 y T31', () => {
  type Field = { selector: string; type?: string; inputMode?: string; autoComplete?: string };
  const CASES: { name: string; route: string; open: string[]; fields: Field[] }[] = [
    {
      name: 'sorteos · crear sorteo',
      route: '/admin/raffles',
      open: ['Crear Sorteo'],
      fields: [
        { selector: 'input[name="maxTotalTickets"]', type: 'number', inputMode: 'numeric' },
        { selector: 'input[name="maxTicketsPerUser"]', type: 'number', inputMode: 'numeric' },
        { selector: 'input[placeholder="dd/mm/aaaa hh:mm"]', autoComplete: 'off' },
      ],
    },
    {
      name: 'sorteos · regla de boletos',
      route: '/admin/raffles',
      open: ['Reglas de boletos', 'Crear Regla'],
      fields: [
        { selector: 'input[name="priority"]', type: 'number', inputMode: 'numeric' },
        { selector: 'input[name="ticketsToAward"]', type: 'number', inputMode: 'numeric' },
      ],
    },
    {
      name: 'foro · historia de impacto',
      route: '/admin/forum',
      open: ['Nueva historia'],
      fields: [
        { selector: 'input[type="date"]', type: 'date' },
        { selector: 'input[type="number"][min="0"]:not([step])', type: 'number', inputMode: 'numeric' },
        { selector: 'input[step="0.01"]', type: 'number', inputMode: 'decimal' },
      ],
    },
    {
      name: 'promociones · nueva promoción',
      route: '/admin/key-promotions',
      open: ['Nueva promoción'],
      fields: [
        { selector: 'input[type="datetime-local"]', type: 'datetime-local' },
        { selector: 'input[placeholder="70"]', inputMode: 'numeric' },
        { selector: 'input[placeholder="0"]', inputMode: 'numeric' },
      ],
    },
    {
      name: 'configuración · editar precio',
      route: '/admin/config',
      open: ['Precios', 'Editar'],
      fields: [{ selector: 'input[type="number"]', type: 'number', inputMode: 'decimal' }],
    },
    {
      name: 'sorteos · editar sorteo',
      route: '/admin/raffles/[id]',
      open: ['Editar'],
      fields: [
        { selector: 'input[name="title"]' },
        { selector: 'textarea[name="description"]' },
        { selector: 'select[name="raffleType"]' },
      ],
    },
    {
      name: 'reconocimientos · paso 1',
      route: '/admin/recognitions/new',
      open: [],
      fields: [{ selector: 'input[type="date"]', type: 'date' }],
    },
  ];

  for (const { name, route, open, fields } of CASES) {
    test(`admin · ${name}: atributos y campos de 16 px`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-360', 'los formularios se miden a 360 px');
      const entry = PANEL_PAGES.find((p) => p.route === route);
      if (!entry) throw new Error(`forms.spec.ts: ${route} no está en panelPages.ts`);
      await gotoPanelPage(page, context, entry);
      await settle(page);
      for (const buttonName of open) {
        await page.getByRole('button', { name: buttonName, exact: true, disabled: false }).first().click();
        await page.waitForTimeout(500);
      }
      for (const expected of fields) {
        const field = page.locator(expected.selector).first();
        await expect(field, expected.selector).toBeVisible();
        if (expected.type) await expect(field).toHaveAttribute('type', expected.type);
        if (expected.inputMode) await expect(field).toHaveAttribute('inputmode', expected.inputMode);
        if (expected.autoComplete) await expect(field).toHaveAttribute('autocomplete', expected.autoComplete);
      }
      const sizes = await fieldFontSizes(page);
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes.filter((size) => size < MIN_FONT_PX), 'campos de menos de 16 px').toEqual([]);
    });
  }
});
