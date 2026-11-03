import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Barrido de PII (CA-28, P-16): el código nuevo de la ficha tributaria y las sedes no escribe
// en consola, en el almacenamiento del navegador ni en la URL. La ficha lleva datos fiscales y
// las sedes direcciones; ninguno debe terminar en un log, en `localStorage` o en una query.

const ROOT = process.cwd();

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { name: 'console', pattern: /\bconsole\s*\./ },
  { name: 'localStorage', pattern: /\blocalStorage\b/ },
  { name: 'sessionStorage', pattern: /\bsessionStorage\b/ },
  { name: 'URLSearchParams', pattern: /\bURLSearchParams\b/ },
  { name: 'window.location', pattern: /\bwindow\s*\.\s*location\b/ },
  { name: 'router con query', pattern: /\brouter\s*\.\s*(push|replace)\s*\([^)]*\?/ },
  { name: 'href con query', pattern: /\bhref\s*=\s*\{?\s*[`"'][^`"']*\?/ },
];

// Quita comentarios para no marcar una mención en un texto explicativo.
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

export function scanForLeaks(source: string): string[] {
  const code = stripComments(source);
  return RULES.filter((rule) => rule.pattern.test(code)).map((rule) => rule.name);
}

describe('scanForLeaks', () => {
  it.each([
    ['console.log(x)', 'console'],
    ["localStorage.setItem('k', v)", 'localStorage'],
    ["sessionStorage.getItem('k')", 'sessionStorage'],
    ['new URLSearchParams(q)', 'URLSearchParams'],
    ["window.location.href = '/x'", 'window.location'],
    ['router.push(`/x?y=${z}`)', 'router con query'],
    ['<Link href={`/x?${q}`}>a</Link>', 'href con query'],
  ])('marca %s', (fragment, rule) => {
    expect(scanForLeaks(fragment)).toContain(rule);
  });

  it.each([
    'toast.error(message)',
    '<Link href="/commercial/profile">Volver</Link>',
    '// console.log(x) en un comentario',
    '/* localStorage */ const a = 1;',
    'router.push("/commercial/profile")',
  ])('no marca %s', (fragment) => {
    expect(scanForLeaks(fragment)).toEqual([]);
  });
});

// Archivos y carpetas nuevos de esta entrega, desde la raíz del repositorio.
const TARGETS = [
  'src/components/commercial/tax-profile',
  'src/components/commercial/establishments',
  'src/lib/taxProfile',
  'src/lib/money',
  'src/lib/api/apiError.ts',
  'src/lib/utils/dateDisplay.ts',
  'src/lib/labels/taxCompliance.ts',
  'src/services/commercial/TaxProfileService.ts',
  'src/services/commercial/DeclarationService.ts',
  'src/hooks/commercial/taxProfileKeys.ts',
  'src/hooks/commercial/useTaxProfile.ts',
  'src/components/commercial/onboarding/steps/5b-TaxProfileStep.tsx',
  'src/components/commercial/onboarding/onboardingSteps.ts',
  'src/components/shared/Dialog.tsx',
  'src/components/shared/StatusBadge.tsx',
  'src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx',
  'src/app/commercial/profile/tax-info/page.tsx',
  'src/app/commercial/profile/establishments/page.tsx',
  // Compromiso de formalización (spec 015).
  'src/lib/formalization',
  'src/lib/labels/formalizationCommitment.ts',
  'src/components/commercial/onboarding/contract',
  'src/components/commercial/onboarding/steps/6-ContractStep.tsx',
  'src/hooks/commercial/useFormalizationCommitment.ts',
  'src/hooks/commercial/useApproveContract.ts',
  // Expediente y solicitudes de información (spec 016). Header.tsx y el asistente de onboarding
  // no entran: el asistente tiene deuda previa (`sessionStorage` en el pago).
  'src/components/commercial/expediente',
  'src/components/commercial/information-requests',
  'src/lib/expediente',
  'src/lib/informationRequests',
  'src/lib/notifications/informationRequestNotifications.ts',
  'src/lib/labels/expedienteRequests.ts',
  'src/services/commercial/ExpedienteService.ts',
  'src/services/commercial/InformationRequestService.ts',
  'src/hooks/commercial/expedienteKeys.ts',
  'src/hooks/commercial/informationRequestKeys.ts',
  'src/hooks/commercial/useExpediente.ts',
  'src/hooks/commercial/useInformationRequests.ts',
  'src/app/commercial/profile/documents/page.tsx',
  'src/app/commercial/profile/information-requests/page.tsx',
  'src/app/commercial/profile/information-requests/[requestPublicId]/page.tsx',
  'src/components/notifications/NotificationsPanel.tsx',
  'src/components/commercial/layout/Sidebar.tsx',
  // Revisión de fichas y caso del empresario (spec 017).
  'src/components/compliance/tax-profiles',
  'src/components/compliance/case',
  'src/components/compliance/ComplianceLayout.tsx',
  'src/lib/compliance',
  'src/lib/a11y',
  'src/lib/labels/complianceTaxReview.ts',
  'src/services/compliance',
  'src/hooks/compliance',
  'src/app/compliance/tax-profiles',
  'src/app/compliance/commercials',
];

function collectFiles(path: string): string[] {
  const absolute = join(ROOT, path);
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute).flatMap((entry) => collectFiles(join(path, entry)));
}

describe('archivos nuevos de la ficha tributaria', () => {
  const files = TARGETS.flatMap(collectFiles);

  it('hay archivos que revisar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('ninguno escribe en consola, almacenamiento ni URL', () => {
    const violations = files.flatMap((file) =>
      scanForLeaks(readFileSync(file, 'utf8')).map(
        (rule) => `${relative(ROOT, file).split(sep).join('/')}: ${rule}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});
