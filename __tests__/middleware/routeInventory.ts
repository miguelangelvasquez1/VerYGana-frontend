import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('../../src/app', import.meta.url));

export type PageEntry = {
  /** Ruta del archivo relativa a `src/app`, con `/` como separador. */
  file: string;
  /** Plantilla de la ruta: sin grupos `(x)`, con los segmentos dinámicos tal cual (`/admin/raffles/[id]`). */
  route: string;
  /** URL de ejemplo: cada segmento dinámico sustituido por un valor ficticio. */
  url: string;
  /** Grupo de rutas del que sale (`consumer`, `auth`) o `null`. Sirve para distinguir páginas con la misma URL base. */
  group: string | null;
};

// Next acepta cualquiera de estas extensiones para una página y para un route handler.
const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;
const ROUTE_HANDLER_FILE = /^route\.(tsx|ts|jsx|js)$/;

function walk(dir: string, fileName: RegExp): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, fileName));
    else if (fileName.test(name)) out.push(full);
  }
  return out;
}

/** Route handlers (`route.tsx`, `route.ts`, `route.jsx` o `route.js`) de `src/app`, ordenados, relativos a esa carpeta. */
export function listRouteHandlers(appDir: string = APP_DIR): string[] {
  return walk(appDir, ROUTE_HANDLER_FILE)
    .map((full) => relative(appDir, full).split(sep).join('/'))
    .sort();
}

/** Recorre `src/app/**\/page.{tsx,ts,jsx,js}` y arma la ruta y la URL de cada página, ordenadas. */
export function listPages(appDir: string = APP_DIR): PageEntry[] {
  return walk(appDir, PAGE_FILE)
    .map((full) => relative(appDir, full).split(sep).join('/'))
    .sort()
    .map((file) => {
      const segments = file.split('/').slice(0, -1); // sin el archivo `page.*`
      const group = segments.find((s) => /^\(.+\)$/.test(s))?.slice(1, -1) ?? null;
      const visible = segments.filter((s) => !/^\(.+\)$/.test(s));
      const route = '/' + visible.join('/');
      const url = '/' + visible.map((s) => (/^\[.+\]$/.test(s) ? 'ejemplo' : s)).join('/');
      return { file, route, url, group };
    });
}
