import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './consumerScope';
import { scanJsx, type JsxRule } from './jsxInteractive';
import { scanPanelJsx, type PanelRule } from './jsxPanels';
import { panelEntries, panelScope } from './panelScope';

// CA-6, CA-8 y RN-7 de la spec 014, sobre el código de los paneles (comercial, admin, cumplimiento) y las
// páginas públicas y de autenticación que no cubrió la 012.
//
// KNOWN_VIOLATIONS es la lista de pendientes (plan.md 2.3, 2.4 y 2.5) y solo baja, igual que el tope de
// lint: falla si aparece una violación que no está en la lista y falla si una de la lista ya no existe.
// Cada tarea que arregla un archivo saca sus entradas. La lista no lleva número de línea para que no se
// rompa al editar el archivo. Una entrada repetida cuenta tantas veces como se repita. T35 la dejó vacía: cualquier violación
// nueva es un error, no una entrada a la lista.
//
// Fuera del análisis: `src/components/game-designer/**`. Los widgets de JSON Schema son del panel del
// diseñador (fuera de alcance, plan.md 2.1 y 14), los importa `commercial/branding` y no se editan aquí.
interface KnownViolation {
  file: string;
  rule: JsxRule | PanelRule;
  text: string;
}

const KNOWN_VIOLATIONS: KnownViolation[] = [];

/** Páginas de C (54) y de B que no estaban en la 012 (6): `page.tsx` de cada ruta del alcance. */
const COMMERCIAL_PAGES = 27;
const ADMIN_PAGES = 21;
const COMPLIANCE_PAGES = 6;
const PUBLIC_PAGES_NEW = [
  'src/app/forgot-password/page.tsx',
  'src/app/unlock-account/page.tsx',
  'src/app/terminos/page.tsx',
  'src/app/commercial-onboarding/page.tsx',
  'src/app/plans/page.tsx',
  'src/app/plans/checkout/page.tsx',
];
const LAYOUTS = [
  'src/components/commercial/layout/DashboardLayout.tsx',
  'src/components/admin/AdminLayout.tsx',
  'src/components/compliance/ComplianceLayout.tsx',
];

const EXCLUDED = /^src\/components\/game-designer\//;
const key = (v: KnownViolation) => `${v.file} | ${v.rule} | ${v.text}`;

function countBy(items: KnownViolation[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

describe('alcance de los paneles (spec 014)', () => {
  const scope = panelScope();
  const pages = panelEntries().filter((e) => e.endsWith('/page.tsx'));

  it('incluye las 54 páginas de C y las 6 de B que no estaban en la 012', () => {
    const under = (dir: string) => pages.filter((p) => p.startsWith(`src/app/${dir}/`));
    expect(under('commercial')).toHaveLength(COMMERCIAL_PAGES);
    expect(under('admin')).toHaveLength(ADMIN_PAGES);
    expect(under('compliance')).toHaveLength(COMPLIANCE_PAGES);
    expect(COMMERCIAL_PAGES + ADMIN_PAGES + COMPLIANCE_PAGES).toBe(54);
    expect(PUBLIC_PAGES_NEW.filter((p) => !scope.includes(p))).toEqual([]);
  });

  it('incluye los tres layouts, y TableScroll en cuanto exista', () => {
    expect(LAYOUTS.filter((l) => !scope.includes(l))).toEqual([]);
    if (existsSync(path.join(REPO_ROOT, 'src/components/shared/TableScroll.tsx'))) {
      // Solo está en el cierre cuando alguna página lo importa.
      expect(scope).toContain('src/components/shared/TableScroll.tsx');
    }
  });

  it('no incluye nada de src/app/game-designer', () => {
    expect(scope.filter((f) => f.startsWith('src/app/game-designer/'))).toEqual([]);
  });
});

describe('botones, enlaces, hover y tablas del alcance (CA-6, CA-8, RN-7)', () => {
  const found: KnownViolation[] = panelScope()
    .filter((file) => !EXCLUDED.test(file))
    .flatMap((file) => {
      const text = readFileSync(path.join(REPO_ROOT, file), 'utf8');
      return [...scanJsx(file, text), ...scanPanelJsx(file, text)].map(({ rule, text: t }) => ({ file, rule, text: t }));
    });

  it('solo hay las violaciones de KNOWN_VIOLATIONS: ni nuevas ni ya resueltas', () => {
    const actual = countBy(found);
    const known = countBy(KNOWN_VIOLATIONS);

    const added = [...actual].flatMap(([k, n]) => (n > (known.get(k) ?? 0) ? [`${k} (x${n - (known.get(k) ?? 0)})`] : []));
    const stale = [...known].flatMap(([k, n]) => (n > (actual.get(k) ?? 0) ? [`${k} (x${n - (actual.get(k) ?? 0)})`] : []));

    expect(
      added,
      'violación nueva: arréglala (un botón sin acción, un enlace a #, algo que solo aparece con el puntero o una tabla sin TableScroll)',
    ).toEqual([]);
    expect(stale, 'ya no existe, quítala de KNOWN_VIOLATIONS').toEqual([]);
  });
});
