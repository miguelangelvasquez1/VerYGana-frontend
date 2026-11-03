import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from '../support/network';
import {
  hoverOnlyActions,
  measureClipped,
  measureOverflow,
  measureTables,
  nestedInteractive,
  settle,
  smallTouchTargets,
} from '../support/measure';
import { failApi, gotoPanelPage } from '../support/panelOpen';
import { PANEL_PAGES, type PanelPage, type PanelVariant } from '../support/panelPages';

// CA-5, CA-6 y CA-8 de la spec 014: cada página de B y C (y cada variante) a 360, 390 y 768 px, en una sola
// navegación: desborde del documento y del body, recorte (`measureClipped`, plan 2.6), anidación de
// interactivos y, a 360, áreas táctiles, tablas y acciones que solo aparecen con el ratón. El estado de error
// se mide aparte, a 360 (desborde, recorte y áreas táctiles).

const MOBILE_360 = 'mobile-360';

/** Espera a que la página cargue: su texto propio si lo tiene o la red inactiva. */
async function waitLoaded(page: Page, expectText?: string) {
  if (expectText) {
    await expect(page.getByText(expectText).first()).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
  } else {
    await settle(page);
  }
}

const label = (entry: PanelPage, variant?: PanelVariant) => `${entry.route}${variant ? ` · ${variant.name}` : ''}`;

async function open(page: Page, context: BrowserContext, entry: PanelPage, variant?: PanelVariant, url?: string) {
  await gotoPanelPage(page, context, entry, { variant, url });
  await waitLoaded(page, variant?.expectText ?? entry.expectText);
  for (const name of variant?.click ?? []) {
    await page.getByRole('button', { name }).first().click();
    await page.waitForTimeout(500);
  }
}

test.describe('@paneles · layout', () => {
  for (const entry of PANEL_PAGES) {
    for (const variant of [undefined, ...(entry.variants ?? [])]) {
      test(label(entry, variant), async ({ page, context }, testInfo) => {
        const project = testInfo.project.name;

        await open(page, context, entry, variant);

        if (entry.redirectsTo) {
          // No tiene pantalla propia: se comprueba el destino y no se mide dos veces.
          expect(new URL(page.url()).pathname).toBe(entry.redirectsTo);
          return;
        }

        const problems: string[] = [];
        const overflow = await measureOverflow(page);
        if (overflow.documentWidth > overflow.viewport || overflow.bodyWidth > overflow.viewport) {
          problems.push(
            `desborde: documento ${overflow.documentWidth}px y body ${overflow.bodyWidth}px contra viewport ${overflow.viewport}px; se pasan: ${overflow.offenders.join(' | ')}`,
          );
        }
        problems.push(...(await measureClipped(page)).map((p) => `recorte: ${p}`));
        problems.push(...(await nestedInteractive(page)).map((p) => `anidado: ${p}`));
        if (project === MOBILE_360) {
          problems.push(...(await smallTouchTargets(page)).map((p) => `área táctil: ${p}`));
          problems.push(...(await measureTables(page)).map((p) => `tabla: ${p}`));
          problems.push(...(await hoverOnlyActions(page)).map((p) => `hover: ${p}`));
        }
        expect(problems, `${label(entry, variant)} a ${project}`).toEqual([]);
      });
    }
  }
});

test.describe('@paneles · estado de error a 360 px', () => {
  for (const entry of PANEL_PAGES.filter((p) => p.errorApi.length > 0 || p.errorUrl)) {
    test(entry.route, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== MOBILE_360, 'el estado de error se mide a 360 px');

      await failApi(page, entry.errorApi);
      // Sin `expectText`: la página muestra su error, no su contenido.
      await gotoPanelPage(page, context, entry, { url: entry.errorUrl ?? entry.url });
      await settle(page);

      const problems: string[] = [];
      const overflow = await measureOverflow(page);
      if (overflow.documentWidth > overflow.viewport || overflow.bodyWidth > overflow.viewport) {
        problems.push(`desborde: documento ${overflow.documentWidth}px contra viewport ${overflow.viewport}px; se pasan: ${overflow.offenders.join(' | ')}`);
      }
      problems.push(...(await measureClipped(page)).map((p) => `recorte: ${p}`));
      problems.push(...(await smallTouchTargets(page)).map((p) => `área táctil: ${p}`));
      expect(problems, `${entry.route} en estado de error`).toEqual([]);
    });
  }
});

// T17: la tabla de /admin/users ya tenía `overflow-x-auto`, pero no la señal de desplazamiento (RN-4). Su caja
// es una región con nombre, alcanzable con el teclado y con la clase `table-scroll` (sombras en globals.css).
test.describe('@paneles · TableScroll', () => {
  test('/admin/users · la tabla está en una región .table-scroll desplazable', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'se mide a 360 px');
    const entry = PANEL_PAGES.find((p) => p.route === '/admin/users');
    if (!entry) throw new Error('layout.spec.ts: /admin/users no está en panelPages.ts');
    await open(page, context, entry);

    const wrapper = page.locator('table').first().locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " table-scroll ")][1]');
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper).toHaveAttribute('role', 'region');
    await expect(wrapper).toHaveAttribute('aria-label', /desplazable/);
    await expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(await wrapper.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
  });
});

// Corrección de T23: "Ver diseño" era `hidden sm:flex` y en el celular no se podía usar (RN-1 y sección C de la
// spec piden los paneles usables completos). Se muestra también por debajo de `sm`, con 44 px. En la solicitud el
// botón del encabezado sale con estado `CAMPAIGN_CREATED` (o `CHANGES_REQUESTED`), por eso la variante.
test.describe('@paneles · Ver diseño en el celular', () => {
  const CASES: { route: string; variant?: PanelVariant }[] = [
    { route: '/commercial/branding/campaigns/[id]' },
    {
      route: '/commercial/branding/requests/[id]',
      variant: {
        name: 'campaña creada',
        fixtures: { '**/branding-requests/1': 'api/branding-requests/detail-campaign-created.json' },
        expectText: 'Marca de Prueba',
      },
    },
  ];
  for (const { route, variant } of CASES) {
    test(`${route} · "Ver diseño" se ve y mide 44 px a 360 px`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== MOBILE_360, 'se mide a 360 px');
      const entry = PANEL_PAGES.find((p) => p.route === route);
      if (!entry) throw new Error(`layout.spec.ts: ${route} no está en panelPages.ts`);
      await open(page, context, entry, variant);
      const preview = page.getByRole('button', { name: 'Ver diseño' }).first();
      await expect(preview).toBeVisible();
      const box = await preview.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(43.5);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360.5);
    });
  }
});
