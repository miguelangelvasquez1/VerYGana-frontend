import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Alcance de la spec 012: el cierre de imports desde las páginas y layouts del consumidor.
// Se calcula en cada corrida, así que un componente que entre después queda dentro sin tocar listas.

export const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

const PAGE_FILES = ['page.tsx', 'layout.tsx'];
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];

/** Archivos `page.tsx` y `layout.tsx` bajo una carpeta (recursivo), como rutas relativas a la raíz. */
function pageFilesUnder(root: string, dir: string): string[] {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  const found: string[] = [];
  for (const name of readdirSync(abs)) {
    const rel = `${dir}/${name}`;
    if (statSync(path.join(root, rel)).isDirectory()) found.push(...pageFilesUnder(root, rel));
    else if (PAGE_FILES.includes(name)) found.push(rel);
  }
  return found;
}

/** Puntos de entrada: páginas y layouts del consumidor, login/registro/verificación, landing y layout raíz. */
export function scopeEntries(root: string = REPO_ROOT): string[] {
  const entries = [
    ...pageFilesUnder(root, 'src/app/(consumer)'),
    ...['login', 'register', 'verify'].flatMap((p) => pageFilesUnder(root, `src/app/(auth)/${p}`)),
    'src/app/page.tsx',
    'src/app/layout.tsx',
  ];
  return entries.filter((rel) => existsSync(path.join(root, rel)));
}

function resolveImport(root: string, from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) base = path.join(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier);
  else return null; // paquete externo
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext;
  }
  return null;
}

/**
 * Archivos `.tsx` alcanzables desde los puntos de entrada, como rutas relativas a la raíz
 * (con `/`) y ordenadas. Se siguen los imports `@/` y relativos, también a través de archivos `.ts`.
 */
export function consumerScope(root: string = REPO_ROOT): string[] {
  const seen = new Set<string>();
  const stack = scopeEntries(root).map((rel) => path.join(root, rel));
  while (stack.length > 0) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    const { importedFiles } = ts.preProcessFile(text, true, true);
    for (const imported of importedFiles) {
      const resolved = resolveImport(root, file, imported.fileName);
      if (resolved) stack.push(resolved);
    }
  }
  return [...seen]
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.relative(root, f).split(path.sep).join('/'))
    .sort();
}
