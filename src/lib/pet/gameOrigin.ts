// Origen del build del juego de mascotas al que `next.config.ts` reescribe /pet-game y /pet-assets.
// Módulo puro y sin imports: lo carga la configuración de Next al construir (SCRUM-105).

export const PET_GAME_ORIGIN_ENV = 'NEXT_PUBLIC_PET_GAME_ORIGIN';

// Bucket de dev: lo que se usa cuando la variable está ausente (local y CI).
export const DEV_PET_GAME_ORIGIN = 'https://pub-4c0bac3292364531a816300210b54c05.r2.dev';

/**
 * Devuelve el origen (esquema + host, sin barra final) del build de mascotas.
 * - `undefined` (variable ausente): el bucket de dev.
 * - Vacío, solo espacios, sin esquema, no https, o con ruta, query, # o credenciales: lanza un Error.
 */
export function resolvePetGameOrigin(raw: string | undefined): string {
  if (raw === undefined) return DEV_PET_GAME_ORIGIN;

  const value = raw.trim();
  const invalid = () =>
    new Error(
      `${PET_GAME_ORIGIN_ENV} no es un origen https:// válido (se recibió "${raw}"). ` +
        'Usa solo esquema y host, por ejemplo https://mascotas-beta.verygana.com, ' +
        'o quita la variable para usar el build de dev.',
    );

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }

  const onlyOrigin =
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.pathname === '/' &&
    url.search === '' &&
    url.hash === '';
  if (!onlyOrigin) throw invalid();

  return url.origin;
}

/** Las dos reglas de reescritura, siempre al mismo origen. */
export function petGameRewrites(origin: string): { source: string; destination: string }[] {
  return [
    { source: '/pet-game/:path*', destination: `${origin}/:path*` },
    { source: '/pet-assets/:path*', destination: `${origin}/:path*` },
  ];
}
