import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Barridos estáticos de la spec 016 (CA-6, CA-7, CA-14, CA-16, CA-20, CA-21, CA-24; P-16): reglas
// de código que ninguna prueba de lógica atrapa. Cada barrido es una función probada con
// fragmentos buenos y malos, y después se aplica a los archivos reales.

const ROOT = process.cwd();

// Quita comentarios para no marcar una mención en un texto explicativo.
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

export function mentions(source: string, pattern: RegExp): boolean {
  return pattern.test(stripComments(source));
}

// Acciones de borrar o editar (CA-7): textos "Eliminar"/"Editar" y llamadas delete/remove.
export const DELETE_OR_EDIT_PATTERNS: RegExp[] = [
  /\bEliminar\b/i,
  /\bEditar\b/i,
  /\.\s*(delete|remove)\w*\s*\(/i,
  /\b(delete|remove)[A-Z]\w*\s*\(/,
];

export function hasDeleteOrEdit(source: string): boolean {
  const code = stripComments(source);
  return DELETE_OR_EDIT_PATTERNS.some((p) => p.test(code));
}

// CA-16: un `useRef` booleano comprobado en la primera línea del envío.
export function guardsDoubleSubmit(source: string): boolean {
  const code = stripComments(source);
  const ref = /const\s+(\w+)\s*=\s*useRef\(\s*false\s*\)/.exec(code);
  if (!ref) return false;
  const first = new RegExp(
    `const\\s+onSubmit\\s*=\\s*async[^{]*\\{\\s*if\\s*\\(\\s*${ref[1]}\\.current\\s*\\)\\s*return`,
  );
  return first.test(code);
}

// CA-21: el componente importa la constante y la usa en un `href`.
export function linksToRequests(source: string): boolean {
  const code = stripComments(source);
  return (
    /import\s*\{[^}]*\bINFORMATION_REQUESTS_PATH\b[^}]*\}\s*from/.test(code) &&
    /\bhref\s*=\s*\{\s*INFORMATION_REQUESTS_PATH\s*\}/.test(code)
  );
}

describe('barridos con fragmentos', () => {
  it('mentions marca el código y no los comentarios', () => {
    expect(mentions('const u = doc.downloadUrl;', /downloadUrl/)).toBe(true);
    expect(mentions('// downloadUrl en un comentario', /downloadUrl/)).toBe(false);
    expect(mentions('/* downloadUrl */ const a = 1;', /downloadUrl/)).toBe(false);
  });

  it.each([
    '<button>Eliminar</button>',
    '<button>Editar documento</button>',
    'await service.delete(id);',
    'removeDocument(id);',
  ])('hasDeleteOrEdit marca %s', (fragment) => {
    expect(hasDeleteOrEdit(fragment)).toBe(true);
  });

  it.each(['<button>Ver</button>', 'const items = list.filter(Boolean);', '// Eliminar: no hay'])(
    'hasDeleteOrEdit no marca %s',
    (fragment) => {
      expect(hasDeleteOrEdit(fragment)).toBe(false);
    },
  );

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

  it('linksToRequests pide la importación y el href', () => {
    const good =
      "import { INFORMATION_REQUESTS_PATH } from '@/x';\n<Link href={INFORMATION_REQUESTS_PATH}>a</Link>";
    expect(linksToRequests(good)).toBe(true);
    expect(linksToRequests('<Link href="/commercial/profile/information-requests">a</Link>')).toBe(
      false,
    );
    expect(linksToRequests("import { INFORMATION_REQUESTS_PATH } from '@/x';")).toBe(false);
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

// Lo que la entrega 016 escribió. Las carpetas viejas de `src/components/commercial` (el asistente de
// onboarding abre el contrato con su propia `downloadUrl`) son otra deuda y quedan fuera.
const SCOPE_016 = [
  'src/components/commercial/expediente',
  'src/components/commercial/information-requests',
  'src/lib/expediente',
  'src/lib/informationRequests',
  'src/lib/notifications/informationRequestNotifications.ts',
  'src/lib/labels/expedienteRequests.ts',
  'src/hooks/commercial/useExpediente.ts',
  'src/hooks/commercial/useInformationRequests.ts',
  'src/app/commercial/profile/documents',
  'src/app/commercial/profile/information-requests',
];

const filesIn = (paths: string[]) => paths.flatMap(collectFiles);

function filesWith(files: string[], pattern: RegExp, except: string[] = []): string[] {
  return files
    .filter((f) => !except.includes(rel(f)))
    .filter((f) => mentions(readFileSync(f, 'utf8'), pattern))
    .map(rel);
}

describe('la entrega 016 no filtra URL firmadas ni identificaciones', () => {
  const files = filesIn(SCOPE_016);

  it('hay archivos que revisar', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('downloadUrl solo se lee en openDocument.ts (CA-6, CA-24)', () => {
    expect(filesWith(files, /\bdownloadUrl\b/, ['src/lib/expediente/openDocument.ts'])).toEqual([]);
  });

  it('uploadUrl solo se lee en uploadFlow.ts (CA-24)', () => {
    expect(filesWith(files, /\buploadUrl\b/, ['src/lib/expediente/uploadFlow.ts'])).toEqual([]);
  });

  it('holderIdentification no aparece en la interfaz ni en la lógica (CA-24)', () => {
    const scoped = filesIn([
      'src/components/commercial/expediente',
      'src/components/commercial/information-requests',
      'src/lib/expediente',
    ]);
    expect(filesWith(scoped, /\bholderIdentification\b/)).toEqual([]);
  });
});

describe('el expediente es de solo lectura (CA-7)', () => {
  it('sin acciones de borrar ni de editar', () => {
    const files = filesIn(['src/components/commercial/expediente']);
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) => hasDeleteOrEdit(readFileSync(f, 'utf8'))).map(rel);
    expect(offenders).toEqual([]);
  });
});

describe('textos con un solo dueño', () => {
  it('los títulos de notificación solo son literales en informationRequestNotifications.ts (CA-20)', () => {
    const all = collectFiles('src');
    const owner = 'src/lib/notifications/informationRequestNotifications.ts';
    expect(filesWith(all, /Solicitud de información de VERYGANA/, [owner])).toEqual([]);
    expect(filesWith(all, /Tu respuesta tiene observaciones/, [owner])).toEqual([]);
    // El dueño sí los tiene: el barrido no pasa por buscar en el sitio equivocado.
    expect(mentions(read(owner), /Solicitud de información de VERYGANA/)).toBe(true);
    expect(mentions(read(owner), /Tu respuesta tiene observaciones/)).toBe(true);
  });

  it('"sanción" solo aparece en expedienteRequests.ts (CA-14)', () => {
    const files = filesIn([
      'src/components/commercial/expediente',
      'src/components/commercial/information-requests',
      'src/components/commercial/tax-profile',
      'src/lib/expediente',
      'src/lib/informationRequests',
      'src/lib/notifications/informationRequestNotifications.ts',
      'src/hooks/commercial/useExpediente.ts',
      'src/hooks/commercial/useInformationRequests.ts',
      'src/app/commercial/profile/documents',
      'src/app/commercial/profile/information-requests',
    ]);
    expect(filesWith(files, /sanci[oó]n/i)).toEqual([]);
    // El texto sí existe en su dueño.
    expect(mentions(read('src/lib/labels/expedienteRequests.ts'), /sanci[oó]n/i)).toBe(true);
  });
});

describe('guardas de interfaz', () => {
  it('RespondForm bloquea el doble envío con un useRef (CA-16)', () => {
    expect(
      guardsDoubleSubmit(read('src/components/commercial/information-requests/RespondForm.tsx')),
    ).toBe(true);
  });

  it('ExpedienteUploadDialog no se deja cerrar mientras sube (CA-16)', () => {
    expect(
      mentions(
        read('src/components/commercial/expediente/ExpedienteUploadDialog.tsx'),
        /<Dialog\b[^>]*\bdismissible=/,
      ),
    ).toBe(true);
  });

  it('el adaptador de refetch de ExpedienteScreen pasa por documentsFromRefetch (B1)', () => {
    expect(
      mentions(
        read('src/components/commercial/expediente/ExpedienteScreen.tsx'),
        /refetch:\s*async\s*\(\)\s*=>\s*documentsFromRefetch\(\s*await\s+query\.refetch\(\)\s*\)/,
      ),
    ).toBe(true);
  });

  it('onUploaded del detalle usa addUploadedDocument (B2)', () => {
    const code = stripComments(
      read('src/components/commercial/information-requests/InformationRequestDetail.tsx'),
    );
    expect(/setDocuments\(\s*\(prev\)\s*=>\s*addUploadedDocument\(\s*prev,/.test(code)).toBe(true);
  });

  it('CommitmentBlock enlaza a la lista de solicitudes (CA-21)', () => {
    expect(linksToRequests(read('src/components/commercial/tax-profile/CommitmentBlock.tsx'))).toBe(
      true,
    );
  });
});
