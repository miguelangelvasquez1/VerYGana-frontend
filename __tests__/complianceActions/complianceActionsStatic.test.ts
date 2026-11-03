import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { guardsDoubleSubmit, mentions, stripComments } from '../complianceTaxReview/staticScan';

// Barridos estáticos de la spec 018 (CA-1, CA-6, CA-18, CA-24 a CA-27; P-2, P-6, P-16): reglas de código
// que ninguna prueba de lógica atrapa. Se aplican a los archivos reales de las pantallas nuevas.

const ROOT = process.cwd();

function collectFiles(path: string): string[] {
  const absolute = join(ROOT, path);
  if (statSync(absolute).isFile()) return /\.(ts|tsx)$/.test(absolute) ? [absolute] : [];
  return readdirSync(absolute).flatMap((entry) => collectFiles(join(path, entry)));
}

const rel = (file: string) => relative(ROOT, file).split(sep).join('/');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

const PAGES = [
  'src/app/compliance/information-requests/page.tsx',
  'src/app/compliance/information-requests/[requestPublicId]/page.tsx',
  'src/app/compliance/alerts/page.tsx',
  'src/app/compliance/alert-rules/page.tsx',
  'src/app/compliance/tax-catalog/page.tsx',
];

const COMPONENT_DIRS = [
  'src/components/compliance/requests',
  'src/components/compliance/findings',
  'src/components/compliance/alerts',
  'src/components/compliance/alert-rules',
  'src/components/compliance/tax-catalog',
];

const NEW_LOGIC = [
  'src/lib/compliance/informationRequestForm.ts',
  'src/lib/compliance/findingForm.ts',
  'src/lib/compliance/alerts.ts',
  'src/lib/compliance/alertRules.ts',
  'src/lib/compliance/taxCatalog.ts',
  'src/lib/labels/complianceActions.ts',
  'src/services/compliance/ComplianceRequestService.ts',
  'src/services/compliance/ComplianceAlertService.ts',
  'src/hooks/compliance/useComplianceRequests.ts',
  'src/hooks/compliance/useComplianceAlerts.ts',
];

const CASE_FILES = [
  'src/components/compliance/case/CaseRequestsTab.tsx',
  'src/components/compliance/case/CaseFindingsTab.tsx',
  'src/components/compliance/case/CaseIncidentsTab.tsx',
];

const componentFiles = COMPONENT_DIRS.flatMap(collectFiles).map(rel);
const allNewFiles = [...PAGES, ...componentFiles, ...NEW_LOGIC, ...CASE_FILES];
const dialogFiles = componentFiles.filter((f) => /<Dialog\b/.test(stripComments(read(f))));

describe('páginas de servidor (CA-25; P-2, P-6)', () => {
  it.each(PAGES)('%s es de servidor y lee params/searchParams con await', (path) => {
    const source = read(path);
    expect(mentions(source, /['"]use client['"]/)).toBe(false);
    if (/params|searchParams/.test(stripComments(source))) {
      expect(mentions(source, /await\s+(params|searchParams)\b/)).toBe(true);
    }
  });
});

describe('sin datos sensibles en logs, almacenamiento ni URL (CA-27; P-16)', () => {
  it.each(allNewFiles)('%s', (path) => {
    const source = read(path);
    expect(mentions(source, /\bconsole\./)).toBe(false);
    expect(mentions(source, /\blocalStorage\b|\bsessionStorage\b/)).toBe(false);
    expect(mentions(source, /<img\b/)).toBe(false);
    expect(mentions(source, /\bURLSearchParams\b/)).toBe(false);
    expect(mentions(source, /:\s*any\b|\bas any\b|<any>/)).toBe(false);
  });
});

describe('diálogos (CA-26)', () => {
  it('hay diálogos que barrer', () => {
    expect(dialogFiles.length).toBeGreaterThanOrEqual(8);
  });

  it.each(dialogFiles)('%s bloquea el doble envío y no se cierra mientras guarda', (path) => {
    const source = read(path);
    expect(guardsDoubleSubmit(source)).toBe(true);
    expect(mentions(source, /<Dialog\b[^>]*\bdismissible=\{!/)).toBe(true);
  });
});

describe('navegación solo con los constructores de routes.ts (CA-27)', () => {
  const NAVIGATING = [...componentFiles, ...CASE_FILES];

  it.each(NAVIGATING)('%s', (path) => {
    const code = stripComments(read(path));
    for (const match of code.matchAll(/router\.(?:push|replace)\(([^)]*)\)/g)) {
      expect(match[1]).toMatch(/Path\(/);
    }
    for (const match of code.matchAll(/href=\{([^}]*)\}/g)) {
      expect(match[1]).toMatch(/Path\(|PATH/);
    }
  });
});

describe('contenido de las pantallas', () => {
  it('RequestDetail comprueba isUuid antes de montar la consulta (CA-6)', () => {
    const code = stripComments(read('src/components/compliance/requests/RequestDetail.tsx'));
    const guard = code.indexOf('isUuid(requestPublicId)');
    const query = code.indexOf('<RequestLoader');
    expect(guard).toBeGreaterThan(-1);
    expect(query).toBeGreaterThan(guard);
  });

  it('AlertCard no recorta el message (CA-18)', () => {
    const code = stripComments(read('src/components/compliance/alerts/AlertCard.tsx'));
    expect(code).toMatch(/alert\.message/);
    expect(code).not.toMatch(/slice|substring|line-clamp|truncate/);
  });

  it('el catálogo usa tablist y no ofrece editar ni eliminar (CA-24)', () => {
    const code = stripComments(read('src/components/compliance/tax-catalog/TaxCatalog.tsx'));
    expect(code).toMatch(/role="tablist"/);
    const catalog = componentFiles.filter((f) => f.includes('/tax-catalog/')).map((f) => stripComments(read(f)));
    for (const source of catalog) expect(source).not.toMatch(/Editar|Eliminar|Borrar/);
    const labels = read('src/lib/labels/complianceActions.ts');
    expect(labels).not.toMatch(/'Editar|'Eliminar/);
  });

  it('el menú del portal tiene las cuatro entradas nuevas (CA-1)', () => {
    const layout = read('src/components/compliance/ComplianceLayout.tsx');
    for (const href of [
      '/compliance/information-requests',
      '/compliance/alerts',
      '/compliance/alert-rules',
      '/compliance/tax-catalog',
    ]) {
      expect(layout).toContain(`href: '${href}'`);
    }
  });
});

describe('sin cambios de protección (CA-25)', () => {
  it('el matcher del middleware cubre /compliance/:path* y las cinco rutas cuelgan de él', () => {
    const middleware = read('src/middleware.ts');
    expect(middleware).toContain("'/compliance/:path*'");
    for (const page of PAGES) expect(page.startsWith('src/app/compliance/')).toBe(true);
  });
});

describe('comunicaciones fallidas (CA-3)', () => {
  it('la fila de una comunicación muestra su errorDetail', () => {
    const code = stripComments(read('src/components/compliance/requests/RequestCommunications.tsx'));
    expect(code).toMatch(/\.errorDetail/);
    expect(code).toMatch(/deliveryStatus === 'FAILED'/);
  });
});
