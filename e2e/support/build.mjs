// Build de la app para las pruebas de navegador (spec 012, plan 7.2).
// Las NEXT_PUBLIC_* quedan fijas al compilar (P-3), así que las pruebas necesitan su propio build,
// apuntando a la API simulada en loopback. Todos los valores son ficticios y públicos.
// Escribe en `.next` (el mismo directorio que `npm run build`): después hay que volver a correr
// `npm run build` antes de `npx tsc --noEmit`.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4010',
  NEXT_PUBLIC_WS_URL: 'http://127.0.0.1:4010/ws',
  NEXT_PUBLIC_PET_GAME_URL: 'http://127.0.0.1:4010/pet-game-stub',
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'ficticia-solo-para-pruebas',
};

const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: root,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error('No se pudo ejecutar next build:', result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
