// Servidor del front para las pruebas de navegador: el build `standalone`, igual que en la imagen
// Docker (se copian `.next/static` y `public` dentro de `.next/standalone`), en 127.0.0.1:3100.
// El secreto de next-auth llega por `NEXTAUTH_SECRET` desde `playwright.config.ts`, que lo toma del
// secreto ficticio de `__tests__/middleware/session.ts`. No se define `MIDDLEWARE`: el middleware
// deja pasar todo (P-4, modo desarrollo) y la sesión de la prueba es real para next-auth.
import { spawn } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const standalone = path.join(root, '.next/standalone');

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('Falta .next/standalone/server.js: corre `pnpm run build:e2e` antes.');
  process.exit(1);
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error('Falta NEXTAUTH_SECRET: lo define playwright.config.ts.');
  process.exit(1);
}

cpSync(path.join(root, '.next/static'), path.join(standalone, '.next/static'), { recursive: true });
cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });

const env = { ...process.env };
delete env.MIDDLEWARE;
Object.assign(env, {
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  PORT: '3100',
  HOSTNAME: '127.0.0.1',
  NEXTAUTH_URL: 'http://127.0.0.1:3100',
  API_URL: 'http://127.0.0.1:4010',
});

const child = spawn(process.execPath, ['server.js'], { cwd: standalone, env, stdio: 'inherit' });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
