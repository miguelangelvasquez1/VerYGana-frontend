import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { ALLOWED_ORIGIN } from './mockRoutes.mjs';
import type { PanelPage, PanelVariant, TestPlan } from './panelPages';
import { signIn } from './session';

// Abre una página de `panelPages.ts` con su sesión, su plan y las respuestas propias de su variante
// (spec 014). Las respuestas distintas se sirven con `page.route` desde `e2e/fixtures`.

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

/** Respuesta de una ruta del navegador con el contenido de un fixture. Lleva CORS: la API simulada es otro origen. */
async function fulfillFixture(page: Page, pattern: string, fixture: string, status = 200) {
  const body = readFileSync(path.join(FIXTURES_DIR, fixture), 'utf8');
  await page.route(pattern, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Credentials': 'true' },
      body,
    }),
  );
}

/** Fixture del estado del plan del comercial para un plan. `STANDARD` es el de siempre. */
export const planStateFixture = (plan: TestPlan) =>
  plan === 'STANDARD' ? 'api/plans/commercial-state.json' : `api/plans/commercial-state-${plan.toLowerCase()}.json`;

/** Respuestas 500 de la API simulada para los endpoints dados (estado de error). */
export async function failApi(page: Page, patterns: string[]) {
  for (const pattern of patterns) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Credentials': 'true' },
        body: '{"message":"Error simulado"}',
      }),
    );
  }
}

/**
 * Prepara sesión, plan, referencia de pago y respuestas de la variante, y navega. No espera a que la página
 * termine de cargar: eso lo hace quien llama (`settle` o el texto de la variante).
 */
export async function gotoPanelPage(
  page: Page,
  context: BrowserContext,
  entry: PanelPage,
  options: { variant?: PanelVariant; url?: string } = {},
) {
  const { variant, url = entry.url } = options;
  if (entry.role) await signIn(context, entry.role);
  if (entry.sessionStorage) {
    await page.addInitScript((values) => {
      for (const [key, value] of Object.entries(values)) sessionStorage.setItem(key, value);
    }, entry.sessionStorage);
  }
  const plan = variant?.plan ?? entry.plan;
  if (plan && plan !== 'STANDARD') await fulfillFixture(page, '**/plans/commercial/state', planStateFixture(plan));
  for (const [pattern, fixture] of Object.entries(variant?.fixtures ?? {})) await fulfillFixture(page, pattern, fixture);
  await page.goto(url);
}
