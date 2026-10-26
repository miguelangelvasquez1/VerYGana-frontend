import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './support/network';
import { settle } from './support/measure';
import { signIn } from './support/session';

// CA-12 (spec 013): en /ads, al terminar un anuncio, el botón "Me gusta" se alcanza en el celular.
// Video e imagen, en vertical (360 × 740), en horizontal (740 × 360), en celulares anchos (932 × 430 y 915 × 412) y en tableta (768 × 1024).
//
// Medios ficticios de `e2e/fixtures/media` (color sólido, sin audio, unos KB), hechos una sola vez con ffmpeg:
//   ffmpeg -f lavfi -i color=c=0x0b2448:s=180x320:r=10:d=1  -an -c:v libvpx -b:v 30k ad-9x16-1s.webm
//   ffmpeg -f lavfi -i color=c=0x0b2448:s=180x320:r=10:d=10 -an -c:v libvpx -b:v 30k ad-9x16-10s.webm
//   ffmpeg -f lavfi -i color=c=0x0b2448:s=320x180 -frames:v 1 ad-16x9.png
// La API simulada los sirve desde 127.0.0.1:4010 (P-13). Chromium de Playwright no trae H.264: por eso WebM.

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

const FIXTURES = path.join(__dirname, 'fixtures/api/ads');
const adFixture = (name: string) => readFileSync(path.join(FIXTURES, name), 'utf8');

const SIZES = [
  { name: 'vertical 360 × 740', viewport: { width: 360, height: 740 } },
  { name: 'horizontal 740 × 360', viewport: { width: 740, height: 360 } },
  // Entre 768 y 1023 px la barra inferior del celular sigue visible (se oculta desde lg): mismo arreglo.
  { name: 'horizontal ancho 932 × 430', viewport: { width: 932, height: 430 } },
  { name: 'horizontal ancho 915 × 412', viewport: { width: 915, height: 412 } },
  { name: 'tableta vertical 768 × 1024', viewport: { width: 768, height: 1024 } },
];
const KINDS = [
  { name: 'video', fixture: 'next-video-short.json' },
  { name: 'imagen', fixture: 'next-image.json' },
];

async function openFinishedAd(page: Page, fixture: string, kind: string) {
  await page.route('**/adLike/next', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: adFixture(fixture) }),
  );
  await page.goto('/ads');
  if (kind === 'video') {
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused || el.ended), {
        message: 'el video no arrancó: revisa la política de reproducción automática (--autoplay-policy), no el bug',
        timeout: 5_000,
      })
      .toBe(true);
  }
  const like = page.getByRole('button', { name: /Me gusta/ });
  await expect(like).toBeVisible({ timeout: 10_000 });
  // La animación de corazón y el fundido del aviso no deben afectar la medida.
  await page.waitForTimeout(300);
  return like;
}

for (const size of SIZES) {
  test.describe(`CA-12 · ${size.name}`, () => {
    test.use({ viewport: size.viewport });

    test.beforeEach(async ({ context }) => {
      await signIn(context);
    });

    for (const kind of KINDS) {
      test(`${kind.name}: "Me gusta" completo, sin nada encima, y responde al toque`, async ({ page }) => {
        const like = await openFinishedAd(page, kind.fixture, kind.name);
        await settle(page);

        // Aserciones blandas: un fallo lista todas las causas a la vez, no solo la primera.
        const m = await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button')).find((b) => /Me gusta/.test(b.textContent ?? ''))!;
          const rect = button.getBoundingClientRect();
          const bar = document.querySelector('nav[aria-label="Navegación inferior"]')!.getBoundingClientRect();
          const doc = document.documentElement;
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          return {
            rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
            viewport: { width: doc.clientWidth, height: doc.clientHeight },
            barTop: bar.top,
            hit: hit ? `${hit.tagName.toLowerCase()} "${(hit.textContent ?? '').trim().slice(0, 30)}"` : null,
            hitIsButton: hit?.closest('button') === button,
            scrollHeight: doc.scrollHeight,
            clientHeight: doc.clientHeight,
          };
        });

        expect.soft(m.rect.left, 'borde izquierdo dentro de la pantalla').toBeGreaterThanOrEqual(0);
        expect.soft(m.rect.top, 'borde superior dentro de la pantalla').toBeGreaterThanOrEqual(0);
        expect.soft(m.rect.right, 'borde derecho dentro de la pantalla').toBeLessThanOrEqual(m.viewport.width);
        expect.soft(m.rect.bottom, 'borde inferior dentro de la pantalla').toBeLessThanOrEqual(m.viewport.height);
        expect.soft(m.rect.bottom, 'borde inferior por encima de la barra inferior').toBeLessThanOrEqual(m.barTop);
        expect.soft(m.hitIsButton, `el elemento en el centro del botón es ${m.hit}`).toBe(true);
        expect.soft(m.scrollHeight, 'la página no es más alta que la pantalla').toBeLessThanOrEqual(m.clientHeight);

        // `tap()` además comprueba que ningún otro elemento intercepte el toque.
        const request = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/adLike/like'));
        await like.tap({ timeout: 5_000 });
        await request;
      });
    }
  });
}
