import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { consumerScope, REPO_ROOT } from './consumerScope';
import { scanJsx, type JsxRule } from './jsxInteractive';

// CA-3 y CA-4 de la spec 012, sobre el código del alcance del consumidor.
//
// KNOWN_VIOLATIONS es la lista de pendientes (plan.md 2.3 A, B y D) y solo baja, igual que el tope
// de lint: falla si aparece una violación que no está en la lista y falla si una de la lista ya no
// existe. Cada tarea que arregla un archivo saca sus entradas. La lista no lleva número de línea para
// que no se rompa al editar el archivo. Una entrada repetida cuenta tantas veces como se repita.
// La tarea T27 la deja vacía.
interface KnownViolation {
  file: string;
  rule: JsxRule;
  text: string;
}

const KNOWN_VIOLATIONS: KnownViolation[] = [
  // A. Botones sin acción
  // B. Enlaces a `#`
  // D. Botón dentro de enlace
];

const PAGES = [
  'src/app/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(auth)/verify/page.tsx',
  'src/app/(consumer)/ads/page.tsx',
  'src/app/(consumer)/checkout/page.tsx',
  'src/app/(consumer)/commercial/[id]/page.tsx',
  'src/app/(consumer)/forum/page.tsx',
  'src/app/(consumer)/home/page.tsx',
  'src/app/(consumer)/pet/page.tsx',
  'src/app/(consumer)/support/page.tsx',
  'src/app/(consumer)/surveys/page.tsx',
  'src/app/(consumer)/explore/favorites/page.tsx',
  'src/app/(consumer)/explore/gamification/page.tsx',
  'src/app/(consumer)/explore/participations/page.tsx',
  'src/app/(consumer)/explore/profile/page.tsx',
  'src/app/(consumer)/explore/profile/edit/page.tsx',
  'src/app/(consumer)/explore/purchases/page.tsx',
  'src/app/(consumer)/explore/referrals/page.tsx',
  'src/app/(consumer)/explore/transactions/page.tsx',
  'src/app/(consumer)/games/page.tsx',
  'src/app/(consumer)/games/play/page.tsx',
  'src/app/(consumer)/plans/mobile-plans/page.tsx',
  'src/app/(consumer)/products/page.tsx',
  'src/app/(consumer)/products/[id]/page.tsx',
  'src/app/(consumer)/purchases/[id]/confirmation/page.tsx',
  'src/app/(consumer)/raffles/page.tsx',
  'src/app/(consumer)/raffles/[id]/page.tsx',
  'src/app/(consumer)/raffles/[id]/live/page.tsx',
  'src/app/(consumer)/raffles/[id]/results/page.tsx',
];

const REQUIRED_COMPONENTS = [
  'src/components/bars/NavBar.tsx',
  'src/components/bars/NavBarNoAuth.tsx',
  'src/components/Footer.tsx',
  'src/components/consumer/raffles/RaffleDetail.tsx',
  'src/components/plans/PlanCard.tsx',
  'src/components/plans/RechargeCard.tsx',
  'src/components/consumer/ads/Sidebar.tsx',
  'src/components/consumer/home/HomePage.tsx',
];

const key = (v: KnownViolation) => `${v.file} | ${v.rule} | ${v.text}`;

function countBy(items: KnownViolation[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

describe('alcance del consumidor (spec 012)', () => {
  const scope = consumerScope();

  it('incluye las 30 páginas y los componentes compartidos del alcance', () => {
    expect(PAGES).toHaveLength(30);
    expect(PAGES.filter((p) => !scope.includes(p))).toEqual([]);
    expect(REQUIRED_COMPONENTS.filter((c) => !scope.includes(c))).toEqual([]);
  });

  it('no incluye nada de las vistas de comercial, admin, cumplimiento ni diseñador', () => {
    const other = /^src\/(app\/(admin|commercial|compliance|game-designer)\/|components\/(Admin|commercial|compliance|game-designer)\/)/;
    expect(scope.filter((f) => other.test(f))).toEqual([]);
  });
});

describe('botones y enlaces del alcance (CA-3 y CA-4)', () => {
  const found: KnownViolation[] = consumerScope().flatMap((file) =>
    scanJsx(file, readFileSync(path.join(REPO_ROOT, file), 'utf8')).map(({ rule, text }) => ({ file, rule, text })),
  );

  it('solo hay las violaciones de KNOWN_VIOLATIONS: ni nuevas ni ya resueltas', () => {
    const actual = countBy(found);
    const known = countBy(KNOWN_VIOLATIONS);

    const added = [...actual].flatMap(([k, n]) => (n > (known.get(k) ?? 0) ? [`${k} (x${n - (known.get(k) ?? 0)})`] : []));
    const stale = [...known].flatMap(([k, n]) => (n > (actual.get(k) ?? 0) ? [`${k} (x${n - (actual.get(k) ?? 0)})`] : []));

    expect(added, 'violación nueva: arréglala (un botón sin acción, un enlace a # o un botón dentro de un enlace)').toEqual([]);
    expect(stale, 'ya no existe, quítala de KNOWN_VIOLATIONS').toEqual([]);
  });
});
