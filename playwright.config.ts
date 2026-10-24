import { defineConfig, devices } from '@playwright/test';
import { TEST_SECRET } from './__tests__/middleware/session';

// Pruebas de navegador (spec 012; P-13). Solo Chromium. El front de pruebas (build `standalone`, puerto 3100)
// y la API simulada (puerto 4010) viven en loopback; la red externa se cierra en `e2e/support/network.ts`.
// Antes de correr: `npm run build:e2e`.

const WEB_SERVER_TIMEOUT_MS = 120_000;

const touch = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } as const;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    locale: 'es-CO',
  },
  projects: [
    {
      name: 'mobile-360',
      testIgnore: /desktop\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, ...touch },
    },
    {
      name: 'mobile-390',
      testMatch: /(layout|smoke)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, ...touch },
    },
    {
      name: 'tablet-768',
      testMatch: /(layout|smoke)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      // Capturas de escritorio de referencia (CA-8, D-4): dependen del sistema operativo, así que solo
      // corren en local, antes y después de tocar los componentes compartidos.
      name: 'desktop-1280',
      testMatch: /desktop\.spec\.ts/,
      grepInvert: process.env.CI ? /./ : undefined,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: [
    {
      command: 'node e2e/support/mockApi.mjs',
      url: 'http://127.0.0.1:4010/pet-game-stub',
      reuseExistingServer: !process.env.CI,
      timeout: WEB_SERVER_TIMEOUT_MS,
    },
    {
      command: 'node e2e/support/serve.mjs',
      url: 'http://127.0.0.1:3100/login',
      reuseExistingServer: !process.env.CI,
      timeout: WEB_SERVER_TIMEOUT_MS,
      env: { NEXTAUTH_SECRET: TEST_SECRET },
    },
  ],
});
