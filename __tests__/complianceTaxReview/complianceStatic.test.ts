import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { guardsDoubleSubmit, mentions, stripComments } from './staticScan';

// Barridos estáticos de la spec 017 (CA-1, CA-6, CA-10, CA-11, CA-13, CA-18, CA-22; P-2, P-6, P-16):
// reglas de código que ninguna prueba de lógica atrapa. Primero se prueban con fragmentos buenos y
// malos, y después se aplican a los archivos reales.

const ROOT = process.cwd();

describe('barridos con fragmentos', () => {
  it('mentions marca el código y no los comentarios', () => {
    expect(mentions('const u = doc.downloadUrl;', /downloadUrl/)).toBe(true);
    expect(mentions('// downloadUrl en un comentario', /downloadUrl/)).toBe(false);
    expect(mentions('/* downloadUrl */ const a = 1;', /downloadUrl/)).toBe(false);
  });

  it('guardsDoubleSubmit pide el useRef comprobado al inicio', () => {
    const good =
      'const sent = useRef(false);\nconst onSubmit = async (v: X) => {\n  if (sent.current) return;\n  sent.current = true;\n};';
    const noRef = 'const onSubmit = async (v: X) => {\n  await send(v);\n};';
    const lateCheck =
      'const sent = useRef(false);\nconst onSubmit = async (v: X) => {\n  await send(v);\n  if (sent.current) return;\n};';
    expect(guardsDoubleSubmit(good)).toBe(true);
    expect(guardsDoubleSubmit(noRef)).toBe(false);
    expect(guardsDoubleSubmit(lateCheck)).toBe(false);
  });

  it('stripComments quita comentarios de bloque y de línea', () => {
    expect(stripComments('a /* b */ c\n// d\ne')).not.toMatch(/[bd]/);
  });
});

// ---------------------------------------------------------------------------------------------
// Archivos reales

function collectFiles(path: string): string[] {
  const absolute = join(ROOT, path);
  if (statSync(absolute).isFile()) return /\.(ts|tsx)$/.test(absolute) ? [absolute] : [];
  return readdirSync(absolute).flatMap((entry) => collectFiles(join(path, entry)));
}

const rel = (file: string) => relative(ROOT, file).split(sep).join('/');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const filesIn = (paths: string[]) => paths.flatMap(collectFiles);

// Lo que escribió la entrega 017. Las otras carpetas de `src/components/compliance` (contratos,
// cambios de plan) tienen su propia `downloadUrl` y quedan fuera.
const SCOPE_017 = [
  'src/components/compliance/tax-profiles',
  'src/components/compliance/case',
  'src/hooks/compliance',
  'src/lib/compliance',
  'src/app/compliance/tax-profiles',
  'src/app/compliance/commercials',
];

const CASE = 'src/components/compliance/case';
const REVIEW = 'src/components/compliance/tax-profiles';
const PAGES = [
  'src/app/compliance/tax-profiles/page.tsx',
  'src/app/compliance/tax-profiles/[commercialPublicId]/page.tsx',
  'src/app/compliance/commercials/[commercialPublicId]/page.tsx',
];

describe('"Ver" no lee la URL firmada (CA-6, CA-26)', () => {
  const files = filesIn(SCOPE_017);

  it('hay archivos que revisar', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('downloadUrl no aparece en lo nuevo', () => {
    const offenders = files.filter((f) => mentions(readFileSync(f, 'utf8'), /\bdownloadUrl\b/)).map(rel);
    expect(offenders).toEqual([]);
    // El dueño sí la lee: el barrido no mira en el sitio equivocado.
    expect(mentions(read('src/lib/expediente/openDocument.ts'), /\bdownloadUrl\b/)).toBe(true);
  });

  it('useOpenCaseDocument pasa por documentsFromRefetch y abre con noopener,noreferrer (B1)', () => {
    const source = read('src/hooks/compliance/useOpenCaseDocument.ts');
    expect(mentions(source, /documentsFromRefetch\(/)).toBe(true);
    expect(mentions(source, /'noopener,noreferrer'/)).toBe(true);
    expect(mentions(source, /\.refetch\(\)\)\.data/)).toBe(false);
  });

  it('useComplianceCase no parchea la lista de documentos con setQueryData (R-2)', () => {
    const code = stripComments(read('src/hooks/compliance/useComplianceCase.ts'));
    expect(/\bsetQueryData\b/.test(code)).toBe(false);
  });
});

describe('diálogos de revisión (CA-10, CA-18)', () => {
  it.each([`${REVIEW}/SectionReviewDialog.tsx`, `${CASE}/DocumentReviewDialog.tsx`])(
    '%s bloquea el doble envío y no se cierra mientras guarda',
    (path) => {
      const source = read(path);
      expect(guardsDoubleSubmit(source)).toBe(true);
      expect(mentions(source, /<Dialog\b[^>]*\bdismissible=\{!/)).toBe(true);
    },
  );
});

describe('pestañas con acciones (018 reemplaza RN-10 de la 017) y comparador (RN-2, CA-11)', () => {
  const tabs: Array<[string, RegExp, string]> = [
    ['CaseRequestsTab.tsx', /U\.newRequest\b/, 'Nuevo requerimiento'],
    ['CaseFindingsTab.tsx', /U\.actions\.finding\b/, 'Registrar hallazgo'],
    ['CaseIncidentsTab.tsx', /U\.newIncident\b/, 'Registrar incidencia'],
  ];

  it.each(tabs)('%s ofrece su acción de creación', (file, usage, text) => {
    const source = read(`${CASE}/${file}`);
    expect(mentions(source, usage)).toBe(true);
    expect(read('src/lib/labels/complianceActions.ts')).toContain(`'${text}'`);
    expect(mentions(source, /pr[oó]ximamente/i)).toBe(false);
  });

  it('CaseRequestsTab enlaza cada fila al detalle con un Link', () => {
    const source = read(`${CASE}/CaseRequestsTab.tsx`);
    expect(mentions(source, /<Link\b[^>]*requestDetailPath\(/)).toBe(true);
  });

  it('CaseCommitmentTab tampoco tiene acciones', () => {
    const source = read(`${CASE}/CaseCommitmentTab.tsx`);
    expect(mentions(source, /\buseMutation\b/)).toBe(false);
    expect(mentions(source, /<button\b/)).toBe(false);
  });

  it('VersionCompare no monta botones de revisión', () => {
    const source = read(`${REVIEW}/VersionCompare.tsx`);
    expect(mentions(source, /Verificar/)).toBe(false);
    expect(mentions(source, /Observar/)).toBe(false);
    expect(mentions(source, /No aplica/)).toBe(false);
  });
});

describe('"Revisar" solo en los documentos vigentes (CA-13)', () => {
  const source = stripComments(read(`${CASE}/CaseDocumentGroup.tsx`));
  const current = source.indexOf('group.current.map');
  const history = source.indexOf('group.history.map');

  it('hay un recorrido de vigentes y uno de historial', () => {
    expect(current).toBeGreaterThan(-1);
    expect(history).toBeGreaterThan(current);
  });

  it('el botón de revisar está en el de vigentes', () => {
    expect(/onReview\(/.test(source.slice(current, history))).toBe(true);
  });

  it('el historial no menciona revisar', () => {
    expect(/onReview|reviewDocument/.test(source.slice(history))).toBe(false);
  });
});

describe('páginas nuevas de servidor (P-2, P-6)', () => {
  it.each(PAGES)('%s no es de cliente', (path) => {
    expect(/^\s*['"]use client['"]/.test(stripComments(read(path)))).toBe(false);
  });

  it.each(PAGES.filter((p) => p.includes('[commercialPublicId]')))('%s espera params', (path) => {
    expect(mentions(read(path), /await\s+params\b/)).toBe(true);
  });

  it('la cola y el caso esperan searchParams', () => {
    expect(mentions(read(PAGES[0]), /await\s+searchParams\b/)).toBe(true);
    expect(mentions(read(PAGES[2]), /await\s+searchParams\b/)).toBe(true);
  });
});

describe('menú del portal (CA-1)', () => {
  it('NAV tiene "Fichas tributarias" hacia /compliance/tax-profiles', () => {
    expect(
      mentions(
        read('src/components/compliance/ComplianceLayout.tsx'),
        /title:\s*'Fichas tributarias'[^}]*href:\s*'\/compliance\/tax-profiles'/,
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// Correcciones de la ronda 1 (B1, S1-S7)

describe('ronda 1', () => {
  it('B1: el catálogo solo se pide con un id válido (CA-12)', () => {
    const hook = stripComments(read('src/hooks/compliance/useComplianceTaxProfiles.ts'));
    const start = hook.indexOf('export function useComplianceTaxCatalog');
    const body = hook.slice(start, hook.indexOf('export interface', start));
    // Dentro del objeto de `useQuery`, no el parámetro de la firma.
    const call = body.slice(body.indexOf('useQuery({'));
    expect(call.length).toBeGreaterThan(0);
    expect(/^\s*enabled\s*[,:]/m.test(call)).toBe(true);
    const screen = stripComments(read(`${REVIEW}/TaxProfileReview.tsx`));
    expect(/useComplianceTaxCatalog\(\s*validId\s*\)/.test(screen)).toBe(true);
  });

  it('S9: Dialog filtra los enfocables con isTabbable', () => {
    const dialog = stripComments(read('src/components/shared/Dialog.tsx'));
    expect(/\.filter\(\s*isTabbable\s*\)/.test(dialog)).toBe(true);
  });

  it('S2: los botones de revisión no se deshabilitan al abrir el diálogo', () => {
    const screen = stripComments(read(`${REVIEW}/TaxProfileReview.tsx`));
    expect(/disabled=\{active/.test(screen)).toBe(false);
  });

  it('S1: el comparador rotula cada valor en móvil', () => {
    const source = stripComments(read(`${REVIEW}/VersionCompare.tsx`));
    expect(/T\.olderValueLabel\(/.test(source)).toBe(true);
    expect(/T\.currentValueLabel\(/.test(source)).toBe(true);
  });

  it('S3: la cola muestra el paginador en el vacío de una página alta y conserva la tabla ante un error', () => {
    const source = stripComments(read(`${REVIEW}/TaxProfileQueue.tsx`));
    expect(/query\.data === undefined/.test(source)).toBe(true);
    expect(/page > 1/.test(source)).toBe(true);
  });

  it('S5: "Ver" y "Revisar" llevan aria-label con el tipo de documento', () => {
    const source = stripComments(read(`${CASE}/CaseDocumentGroup.tsx`));
    expect(source.match(/aria-label=\{T\.(view|reviewDocument)Of\(/g)?.length).toBe(3);
  });

  it('S6: hallazgos con rótulos', () => {
    const source = stripComments(read(`${CASE}/CaseFindingsTab.tsx`));
    for (const key of ['classificationLabel', 'severityLabel', 'measureLabel']) {
      expect(source.includes(`T.${key}(`)).toBe(true);
    }
  });

  it('S7: la opción vacía del selector tiene texto', () => {
    const source = stripComments(read(`${REVIEW}/TaxProfileReview.tsx`));
    expect(/<option value="">\{T\.chooseVersion\}<\/option>/.test(source)).toBe(true);
  });
});
