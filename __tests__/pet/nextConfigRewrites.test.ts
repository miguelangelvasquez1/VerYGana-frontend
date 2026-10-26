import { afterEach, describe, expect, it, vi } from 'vitest';
import nextConfig from '../../next.config';

// Prueba del cableado: el `next.config.ts` real lee la variable al construir (dentro de `rewrites()`).
const DEV_ORIGIN = 'https://pub-4c0bac3292364531a816300210b54c05.r2.dev';
const BETA_ORIGIN = 'https://mascotas-beta.verygana.com';

async function getRewrites() {
  expect(typeof nextConfig.rewrites).toBe('function');
  const result = await nextConfig.rewrites!();
  expect(Array.isArray(result)).toBe(true);
  return result as { source: string; destination: string }[];
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('next.config rewrites del juego de mascotas', () => {
  it('sin la variable, ambas reglas van al bucket de dev (CA-1)', async () => {
    vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', undefined);
    expect(await getRewrites()).toEqual([
      { source: '/pet-game/:path*', destination: `${DEV_ORIGIN}/:path*` },
      { source: '/pet-assets/:path*', destination: `${DEV_ORIGIN}/:path*` },
    ]);
  });

  it('con la variable (y barra final), ambas reglas van al mismo origen (CA-2, CA-3, CA-5)', async () => {
    vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', `${BETA_ORIGIN}/`);
    expect(await getRewrites()).toEqual([
      { source: '/pet-game/:path*', destination: `${BETA_ORIGIN}/:path*` },
      { source: '/pet-assets/:path*', destination: `${BETA_ORIGIN}/:path*` },
    ]);
  });

  it('con un valor inválido falla nombrando la variable (CA-6)', async () => {
    vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', 'http://mascotas-beta.verygana.com');
    await expect(nextConfig.rewrites!()).rejects.toThrow(/NEXT_PUBLIC_PET_GAME_ORIGIN/);
  });

  it('lee la variable en cada llamada', async () => {
    vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', BETA_ORIGIN);
    const first = await getRewrites();
    vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', 'https://otro.example.test');
    const second = await getRewrites();
    expect(first[0].destination).toBe(`${BETA_ORIGIN}/:path*`);
    expect(second[0].destination).toBe('https://otro.example.test/:path*');
  });
});
