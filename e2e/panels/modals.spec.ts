import { expect, test } from '../support/network';
import { closeStaysVisibleAfterScroll, findOpenDialog, measureModal, settle } from '../support/measure';
import { gotoPanelPage } from '../support/panelOpen';
import { PANEL_MODALS } from '../support/panelModals';
import { PANEL_PAGES } from '../support/panelPages';

// CA-9 de la spec 014, a 360 × 740: cada modal de `panelModals.ts` se abre y se mide (la caja cabe en la
// pantalla, el botón de cerrar se ve y mide 44 px, si el contenido es más alto algo hace scroll dentro y las
// áreas táctiles del diálogo miden 44 px, y con una pantalla baja el botón de cerrar sigue a la vista tras bajar). Los que no se pueden abrir con fixtures llevan su motivo (D-7) y se
// comprueban en la pasada manual (CA-13).

for (const modal of PANEL_MODALS) {
  const entry = PANEL_PAGES.find((p) => p.route === modal.page);
  if (!entry) throw new Error(`panelModals.ts: la página ${modal.page} no está en panelPages.ts`);

  test(`@paneles · modal · ${modal.id}`, async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-360', 'los modales se miden a 360 px');
    test.skip(modal.manualOnly !== undefined, `solo manual: ${modal.manualOnly}`);

    await gotoPanelPage(page, context, entry, { variant: entry.variants?.find((v) => v.name === modal.variant) });
    await settle(page);
    for (const name of modal.open) {
      // Solo botones habilitados: en una lista, el primero con ese nombre puede ser el de un elemento bloqueado.
      await page.getByRole('button', { name, exact: modal.exact ?? true, disabled: false }).first().click();
      await page.waitForTimeout(500);
    }

    const dialog = await findOpenDialog(page);
    await expect(dialog, `el modal ${modal.id} no se abrió`).toBeVisible();
    const report = await measureModal(page, dialog, modal.close);
    // RN-5: con una pantalla baja (un celular en horizontal o con el teclado abierto) hasta el modal más corto tiene
    // que desplazarse; entonces el botón de cerrar sigue a la vista después de bajar (encabezado fijo).
    await page.setViewportSize({ width: 360, height: 360 });
    await page.waitForTimeout(200);
    const lowScreen = await closeStaysVisibleAfterScroll(dialog, modal.close);
    expect(
      [...report.problems, ...report.small.map((s) => `área táctil: ${s}`), ...(lowScreen ? [`pantalla baja: ${lowScreen}`] : [])],
      `modal ${modal.id}`,
    ).toEqual([]);
  });
}
