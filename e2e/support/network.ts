import { test as base, expect } from '@playwright/test';

// Red cerrada de las pruebas de navegador (spec 012, plan 7.2 punto 4; P-13).
// Las pruebas hablan solo con 127.0.0.1 (la app y la API simulada): todo lo demás (reCAPTCHA de Google,
// CDN, fuentes) se aborta, y todo WebSocket se cierra. Al terminar cada prueba se comprueba que la API
// simulada no haya recibido pedidos sin fixture: un hueco de fixtures no puede pasar por "pantalla vacía".

export const MOCK_API_ORIGIN = 'http://127.0.0.1:4010';

const WEB_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:']);

export const test = base.extend<{ closedNetwork: void }>({
  closedNetwork: [
    async ({ context }, use, testInfo) => {
      // Cada pedido del navegador lleva el id de la prueba: con 2 workers, cada una revisa solo lo suyo.
      await context.setExtraHTTPHeaders({ 'x-e2e-test': testInfo.testId });
      await context.route(
        (url) => WEB_PROTOCOLS.has(url.protocol) && url.hostname !== '127.0.0.1',
        (route) => route.abort('blockedbyclient'),
      );
      await context.routeWebSocket(/.*/, (ws) => ws.close());

      await use();

      const response = await context.request.get(`${MOCK_API_ORIGIN}/__unmatched?test=${testInfo.testId}`);
      const unmatched: string[] = await response.json();
      expect(unmatched, 'pedidos a la API simulada sin fixture (agrégalos en e2e/support/mockRoutes.mjs)').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
