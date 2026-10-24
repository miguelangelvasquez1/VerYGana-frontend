// API simulada de las pruebas de navegador: servidor de `node:http` sin dependencias, solo en loopback.
// La usan el navegador y el servidor de Next (`API_URL`). Las respuestas salen de `e2e/fixtures`.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMockRouter } from './mockRoutes.mjs';

const FIXTURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');
export const MOCK_API_PORT = 4010;

/** Lee un fixture por su ruta relativa; undefined si no existe o si intenta salirse de la carpeta. */
function readFixture(name) {
  const file = path.resolve(FIXTURES_DIR, name);
  if (!file.startsWith(FIXTURES_DIR + path.sep)) return undefined;
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

export function startMockApi(port = MOCK_API_PORT) {
  const router = createMockRouter({ readFixture });
  const server = createServer((req, res) => {
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : (v ?? '')]),
    );
    // Los cuerpos de POST/PUT no se usan: se descartan para no dejar el socket colgado.
    req.resume();
    const reply = router.handle({ method: req.method ?? 'GET', url: req.url ?? '/', headers });
    res.writeHead(reply.status, reply.headers);
    res.end(reply.body);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// Arranque directo (`node e2e/support/mockApi.mjs`), como lo hace `webServer` de Playwright.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startMockApi().then(
    () => console.log(`API simulada en http://127.0.0.1:${MOCK_API_PORT}`),
    (error) => {
      console.error('No se pudo abrir la API simulada:', error.code ?? error.message);
      process.exit(1);
    },
  );
}
