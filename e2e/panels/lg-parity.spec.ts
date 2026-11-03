import { expect, test } from '../support/network';
import { settle } from '../support/measure';
import { gotoPanelPage } from '../support/panelOpen';
import { PANEL_PAGES } from '../support/panelPages';

// CA-11 de la spec 014 (T52): a 1280 px una clase pensada para el celular no puede cambiar el escritorio. Se mide
// con el estilo calculado, porque lo que se escapó (`overflow-x-auto` y `overscroll-x-contain` en una barra de
// pestañas y en `TableScroll`) cambia cómo se pinta la página aunque ninguna caja se mueva: la barra de pestañas
// recortaba 1 px del subrayado de la pestaña activa (`-mb-px`) y el contenedor con `overscroll-behavior` propio
// hacía que Chromium rasterizara distinto todo el contenido. Por debajo de `lg` el comportamiento es el de siempre.

const MOBILE_360 = 'mobile-360';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

function entryOf(route: string) {
  const entry = PANEL_PAGES.find((p) => p.route === route);
  if (!entry) throw new Error(`lg-parity.spec.ts: ${route} no está en panelPages.ts`);
  return entry;
}

const styleOf = (loc: import('@playwright/test').Locator) =>
  loc.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { overflowX: cs.overflowX, overscrollX: cs.overscrollBehaviorX, whiteSpace: cs.whiteSpace, flexShrink: cs.flexShrink };
  });

test.describe('@paneles · CA-11 · las clases de celular no llegan al escritorio', () => {
  test('/admin/raffles · la barra de pestañas no recorta el subrayado a 1280 y sí se desliza a 360', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'una sola vez: fija su propio viewport');
    await gotoPanelPage(page, context, entryOf('/admin/raffles'));
    await settle(page);
    const tab = page.getByRole('button', { name: 'Sorteos', exact: true });
    const bar = tab.locator('xpath=..');

    const desktop = await styleOf(bar);
    expect(desktop.overflowX, 'a 1280 la barra no es un contenedor con scroll (recorta el -mb-px de la pestaña)').toBe('visible');
    expect(desktop.overscrollX).toBe('auto');
    const tabDesktop = await styleOf(tab);
    expect(tabDesktop.whiteSpace).toBe('normal');
    expect(tabDesktop.flexShrink).toBe('1');

    await page.setViewportSize({ width: 360, height: 740 });
    const mobile = await styleOf(bar);
    expect(mobile.overflowX, 'a 360 la barra se desliza').toBe('auto');
    expect(mobile.overscrollX).toBe('contain');
    const tabMobile = await styleOf(tab);
    expect(tabMobile.whiteSpace).toBe('nowrap');
    expect(tabMobile.flexShrink).toBe('0');
  });

  test('/admin/users · TableScroll no contiene el scroll encadenado a 1280 y sí a 360', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== MOBILE_360, 'una sola vez: fija su propio viewport');
    await gotoPanelPage(page, context, entryOf('/admin/users'));
    await settle(page);
    const region = page.locator('.table-scroll').first();
    await expect(region).toBeVisible();

    const desktop = await styleOf(region);
    expect(desktop.overflowX).toBe('auto');
    expect(desktop.overscrollX, 'a 1280 no cambia el encadenado del scroll').toBe('auto');

    await page.setViewportSize({ width: 360, height: 740 });
    expect((await styleOf(region)).overscrollX, 'a 360 la tabla contiene el gesto').toBe('contain');
  });
});
