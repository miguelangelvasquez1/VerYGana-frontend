import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Barridos estáticos del compromiso de formalización (spec 015): la casilla nunca llega
// premarcada, el texto vive en un solo sitio y el botón de aprobar nunca se bloquea.

const ROOT = process.cwd();

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

function read(path: string): string {
  return stripComments(readFileSync(join(ROOT, path), 'utf8'));
}

function collect(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((entry) => {
    const rel = `${dir}/${entry}`;
    return statSync(join(ROOT, rel)).isDirectory() ? collect(rel) : [rel];
  });
}

const BLOCK = 'src/components/commercial/onboarding/contract/FormalizationCommitmentBlock.tsx';
const HOOK = 'src/hooks/commercial/useFormalizationCommitment.ts';
const LABELS = 'src/lib/labels/formalizationCommitment.ts';
const STEP = 'src/components/commercial/onboarding/steps/6-ContractStep.tsx';

// RN-1: la casilla no se premarca ni se recuerda.
export function findPrecheckViolations(code: string): string[] {
  const rules: Array<[string, RegExp]> = [
    ['defaultChecked', /\bdefaultChecked\b/],
    ['localStorage', /\blocalStorage\b/],
    ['sessionStorage', /\bsessionStorage\b/],
    ['checked={true}', /checked\s*=\s*\{\s*true\s*\}/],
  ];
  return rules.filter(([, re]) => re.test(code)).map(([name]) => name);
}

// RN-1: el reductor arranca vacío y no recibe datos del servidor.
export function reducerInitIsSafe(code: string): boolean {
  const calls = code.match(/useReducer\s*\([^)]*\)/g) ?? [];
  return (
    calls.length === 1 &&
    calls[0].replace(/\s+/g, '') === 'useReducer(decisionReducer,INITIAL_DECISION_STATE)' &&
    !/useReducer\s*\([^)]*query\.data/.test(code)
  );
}

// CA-11: el StepButton "Aprobar contrato" no lleva `disabled`.
export function approveButtonIsEnabled(code: string): boolean {
  const buttons = code.match(/<StepButton[\s\S]*?\/>/g) ?? [];
  const approve = buttons.filter((b) => /label\s*=\s*["']Aprobar contrato["']/.test(b));
  return approve.length === 1 && !/\bdisabled\b/.test(approve[0]);
}

describe('RN-1: casilla nunca premarcada', () => {
  it.each([
    ['<input type="checkbox" defaultChecked />', 'defaultChecked'],
    ["localStorage.getItem('c')", 'localStorage'],
    ["sessionStorage.setItem('c', '1')", 'sessionStorage'],
    ['<Checkbox checked={true} />', 'checked={true}'],
  ])('marca %s', (fragment, rule) => {
    expect(findPrecheckViolations(fragment)).toContain(rule);
  });

  it('el bloque real no premarca ni guarda la casilla', () => {
    expect(findPrecheckViolations(read(BLOCK))).toEqual([]);
  });

  it.each([
    'const [s, d] = useReducer(decisionReducer, INITIAL_DECISION_STATE, init);',
    'const [s, d] = useReducer(decisionReducer, query.data);',
    'const [s, d] = useReducer(decisionReducer, { ...INITIAL_DECISION_STATE });',
    'const a = 1;',
  ])('rechaza el reductor %s', (fragment) => {
    expect(reducerInitIsSafe(fragment)).toBe(false);
  });

  it('el hook real inicia el reductor con INITIAL_DECISION_STATE', () => {
    expect(reducerInitIsSafe(read(HOOK))).toBe(true);
  });
});

describe('RN-12, CA-16: el texto y el bloque viven en un solo sitio', () => {
  const sources = collect('src')
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ file: f.split(sep).join('/'), code: readFileSync(join(ROOT, f), 'utf8') }));

  const filesWith = (needle: RegExp) =>
    sources.filter((s) => needle.test(stripComments(s.code))).map((s) => s.file);

  it('checkboxLabel solo se usa en el bloque', () => {
    expect(filesWith(/FORMALIZATION_TEXTS\s*\.\s*checkboxLabel/)).toEqual([BLOCK]);
  });

  it('la frase de manifestación está solo en el archivo de textos', () => {
    // Se lee con comentarios: la frase también debe vivir solo ahí.
    const hits = sources
      .filter((s) => s.code.includes('Manifiesto expresamente este compromiso'))
      .map((s) => s.file);
    expect(hits).toEqual([LABELS]);
  });

  it('el bloque solo se importa desde 6-ContractStep.tsx', () => {
    const importers = filesWith(/import[^;]*FormalizationCommitmentBlock[^;]*from/).filter(
      (f) => f !== BLOCK,
    );
    expect(importers).toEqual([STEP]);
  });
});

describe('CA-11: aprobar no se bloquea', () => {
  it.each([
    '<StepButton submitting={s} disabled={!checked} label="Aprobar contrato" />',
    '<StepButton label="Aprobar contrato" disabled />',
    '<StepButton label="Otro" />',
  ])('rechaza %s', (fragment) => {
    expect(approveButtonIsEnabled(fragment)).toBe(false);
  });

  it('el botón real no lleva disabled', () => {
    expect(approveButtonIsEnabled(read(STEP))).toBe(true);
  });
});

describe('T15: Reintentar se deshabilita mientras se envía', () => {
  it('el botón de Reintentar lleva disabled={submitting}', () => {
    const buttons = read(BLOCK).match(/<button\b[\s\S]*?<\/button>/g) ?? [];
    const retry = buttons.filter((b) => /query\.refetch\(\)/.test(b));
    expect(retry).toHaveLength(1);
    expect(retry[0]).toMatch(/disabled\s*=\s*\{\s*submitting\s*\}/);
  });
});

describe('T17: el diálogo de rechazo se carga de forma dinámica', () => {
  it('el bloque no importa RefusalReasonDialog de forma estática', () => {
    const code = read(BLOCK);
    expect(code).not.toMatch(/import\s*\{[^}]*RefusalReasonDialog[^}]*\}\s*from/);
    expect(code).toMatch(/dynamic\(/);
    expect(code).toMatch(/ssr:\s*false/);
  });
});
