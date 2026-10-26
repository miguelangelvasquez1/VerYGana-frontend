import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { listPages, listRouteHandlers } from './routeInventory';

// Route handlers (`src/app/**/route.{tsx,ts,jsx,js}`) que existen hoy. Ninguno exige un rol:
// `api/auth` es público (next-auth) y `api/proxy-download` exige sesión (lo cubre
// `__tests__/proxy/route.test.ts`).
const KNOWN_ROUTE_HANDLERS = ['api/auth/[...nextauth]/route.ts', 'api/proxy-download/route.ts'];

const tmpDirs: string[] = [];
function fakeApp(files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'route-inventory-'));
  tmpDirs.push(root);
  for (const file of files) {
    const full = join(root, file);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, '');
  }
  return root;
}
afterEach(() => {
  for (const dir of tmpDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('listPages', () => {
  it.each(['page.tsx', 'page.ts', 'page.jsx', 'page.js'])('ve %s', (name) => {
    const root = fakeApp([`admin/nueva/${name}`]);
    expect(listPages(root).map((p) => p.route)).toEqual(['/admin/nueva']);
  });

  it('no confunde otros archivos con páginas', () => {
    const root = fakeApp(['admin/layout.tsx', 'admin/page.test.tsx', 'admin/route.ts', 'admin/pages.tsx']);
    expect(listPages(root)).toEqual([]);
  });
});

describe('listRouteHandlers', () => {
  it.each(['route.tsx', 'route.ts', 'route.jsx', 'route.js'])('ve %s', (name) => {
    const root = fakeApp([`api/algo/${name}`, 'api/algo/page.tsx']);
    expect(listRouteHandlers(root)).toEqual([`api/algo/${name}`]);
  });
});

describe('route handlers de src/app', () => {
  it('son exactamente los conocidos', () => {
    expect(
      listRouteHandlers(),
      'Apareció (o desapareció) un route handler en src/app. Decide si exige sesión o rol: si ' +
        'exige un rol, protégelo (middleware o comprobación en el propio handler) y pruébalo rol ' +
        'por rol como las páginas; luego agrégalo a KNOWN_ROUTE_HANDLERS en este archivo y a las ' +
        'rutas públicas o con sesión que documenta CLAUDE.md. El middleware no lo cubre solo.',
    ).toEqual(KNOWN_ROUTE_HANDLERS);
  });
});
