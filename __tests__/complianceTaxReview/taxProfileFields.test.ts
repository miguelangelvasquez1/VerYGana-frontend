import { describe, expect, it } from 'vitest';
import {
  SECTION_ORDER,
  comparableVersions,
  diffSection,
  sectionFields,
  type DiffRow,
  type FieldRow,
} from '@/lib/compliance/taxProfileFields';
import { groupCatalog } from '@/lib/taxProfile/catalog';
import { INCOME_SCOPE_LABELS, TAX_PROFILE_SECTION_TITLES } from '@/lib/labels/taxCompliance';
import { formatCents } from '@/lib/money/cents';
import type {
  CatalogEntry,
  TaxCatalogType,
  TaxProfileVersionDetail,
  VersionSummary,
} from '@/types/commercial/TaxProfile.types';

function makeVersion(overrides: Partial<TaxProfileVersionDetail> = {}): TaxProfileVersionDetail {
  return {
    versionNumber: 1,
    submittedAt: '2026-04-01T10:00:00Z',
    rutDocumentId: 5,
    rutResponsibilityCodes: ['R-01', 'R-02'],
    regimeCode: 'REG-A',
    activities: [
      { ciiuCode: '4711', description: 'Comercio al por menor', main: true },
      { ciiuCode: '5611', description: null, main: false },
    ],
    vatConditionCode: 'IVA-1',
    incConditionCode: null,
    taxConditionScope: 'Todos los productos',
    invoicingObligated: true,
    invoicingMethodCode: 'FAC-1',
    invoicingNotes: null,
    withholdingAgent: false,
    withholdingNotes: null,
    incomeReports: [
      {
        concept: 'VENTAS',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        amountCents: 123456789,
        currency: 'COP',
        scope: 'EXTERNAL_ONLY',
        supportDocumentId: null,
        notes: null,
      },
    ],
    establishmentsCount: 3,
    currentCapacity: 'Capacidad ficticia',
    growthScenario: null,
    growthMeasures: null,
    hasAccountingAdvisor: false,
    advisorScope: null,
    ...overrides,
  };
}

let nextId = 1;
function entry(
  catalogType: TaxCatalogType,
  code: string,
  label: string,
  active = true,
): CatalogEntry {
  return {
    id: nextId++,
    catalogType,
    code,
    label,
    legalBasis: 'Base ficticia',
    validFrom: '2020-01-01',
    validTo: active ? null : '2025-01-01',
    active,
  };
}

const CATALOG = groupCatalog([
  entry('REGIME', 'REG-A', 'Régimen ordinario'),
  entry('REGIME', 'REG-OLD', 'Régimen retirado', false),
  entry('RUT_RESPONSIBILITY', 'R-01', 'Responsable de IVA'),
  entry('RUT_RESPONSIBILITY', 'R-02', 'Gran contribuyente'),
  entry('VAT_CONDITION', 'IVA-1', 'Responsable'),
  entry('INC_CONDITION', 'INC-1', 'No responsable'),
  entry('INVOICING_METHOD', 'FAC-1', 'Factura electrónica'),
  entry('REGIME', 'X1', 'Etiqueta de régimen'),
  entry('VAT_CONDITION', 'X1', 'Etiqueta de IVA'),
]);
const EMPTY = groupCatalog([]);

function row(rows: FieldRow[], key: string): FieldRow {
  const found = rows.find((r) => r.key === key);
  if (!found) throw new Error(`fila ${key} no encontrada`);
  return found;
}
function valueOf(rows: FieldRow[], key: string): string {
  const r = row(rows, key);
  if (r.kind !== 'value') throw new Error('no es un valor');
  return r.value;
}
function itemsOf(rows: FieldRow[], key: string): string[] {
  const r = row(rows, key);
  if (r.kind !== 'list') throw new Error('no es una lista');
  return r.items.map((i) => i.text);
}
function diffRow(rows: DiffRow[], key: string): DiffRow {
  const found = rows.find((r) => r.key === key);
  if (!found) throw new Error(`fila ${key} no encontrada`);
  return found;
}

describe('SECTION_ORDER', () => {
  it('es el orden a) a h) del diccionario y todas tienen filas (CA-5)', () => {
    expect(SECTION_ORDER).toEqual(Object.keys(TAX_PROFILE_SECTION_TITLES));
    expect(SECTION_ORDER).toHaveLength(8);
    const version = makeVersion();
    for (const section of SECTION_ORDER) {
      expect(sectionFields(section, version, CATALOG).length).toBeGreaterThan(0);
    }
  });
});

describe('sectionFields', () => {
  it('a) RUT vinculado y responsabilidades', () => {
    const rows = sectionFields('A_RUT', makeVersion(), CATALOG);
    expect(valueOf(rows, 'rutDocument')).toBe('Vinculado');
    expect(itemsOf(rows, 'rutResponsibilities')).toEqual([
      'R-01 — Responsable de IVA',
      'R-02 — Gran contribuyente',
    ]);
    const none = sectionFields('A_RUT', makeVersion({ rutDocumentId: null }), CATALOG);
    expect(valueOf(none, 'rutDocument')).toBe('Sin documento RUT vinculado');
  });

  it('b) la actividad principal va marcada', () => {
    const rows = sectionFields('B_REGIME_ACTIVITIES', makeVersion(), CATALOG);
    expect(itemsOf(rows, 'activities')).toEqual([
      'CIIU 4711 (principal) · Comercio al por menor',
      'CIIU 5611',
    ]);
  });

  it('d) Sí o No', () => {
    const rows = sectionFields('D_INVOICING_WITHHOLDING', makeVersion(), CATALOG);
    expect(valueOf(rows, 'invoicingObligated')).toBe('Sí');
    expect(valueOf(rows, 'withholdingAgent')).toBe('No');
  });

  it('e) un ítem por periodo, con monto con separador y alcance (CA-7)', () => {
    const withSupport = makeVersion({
      incomeReports: [
        {
          concept: 'VENTAS',
          periodStart: '2026-01-01',
          periodEnd: '2026-03-31',
          amountCents: 123456789,
          currency: 'COP',
          scope: 'PLATFORM_ONLY',
          supportDocumentId: 9,
          notes: null,
        },
      ],
    });
    const [text] = itemsOf(sectionFields('E_INCOME', withSupport, CATALOG), 'income');
    expect(text).toContain('Ventas');
    expect(text).toContain('del 1 de enero de 2026 al 31 de marzo de 2026');
    expect(text).toContain(formatCents(123456789));
    expect(text).toContain(INCOME_SCOPE_LABELS.PLATFORM_ONLY);
    expect(text).toContain('Con soporte');
    const [plain] = itemsOf(sectionFields('E_INCOME', makeVersion(), CATALOG), 'income');
    expect(plain).not.toContain('Con soporte');
  });

  it('f) sedes declaradas al enviar', () => {
    const rows = sectionFields('F_ESTABLISHMENTS', makeVersion(), CATALOG);
    expect(row(rows, 'establishmentsCount').label).toBe('Sedes declaradas al enviar');
    expect(valueOf(rows, 'establishmentsCount')).toBe('3');
  });

  it('h) sin asesor no hay fila de alcance', () => {
    const rows = sectionFields('H_ADVISORY', makeVersion(), CATALOG);
    expect(rows.find((r) => r.key === 'advisorScope')).toBeUndefined();
    const withAdvisor = sectionFields(
      'H_ADVISORY',
      makeVersion({ hasAccountingAdvisor: true, advisorScope: 'Declaraciones' }),
      CATALOG,
    );
    expect(valueOf(withAdvisor, 'advisorScope')).toBe('Declaraciones');
  });

  it('códigos como "código — etiqueta", incluidos los retirados (CA-29)', () => {
    const rows = sectionFields('B_REGIME_ACTIVITIES', makeVersion({ regimeCode: 'REG-OLD' }), CATALOG);
    expect(valueOf(rows, 'regime')).toBe('REG-OLD — Régimen retirado');
    expect(valueOf(sectionFields('B_REGIME_ACTIVITIES', makeVersion(), CATALOG), 'regime')).toBe(
      'REG-A — Régimen ordinario',
    );
    const c = sectionFields('C_VAT_INC', makeVersion({ incConditionCode: 'INC-1' }), CATALOG);
    expect(valueOf(c, 'vatCondition')).toBe('IVA-1 — Responsable');
    expect(valueOf(c, 'incCondition')).toBe('INC-1 — No responsable');
    expect(valueOf(sectionFields('D_INVOICING_WITHHOLDING', makeVersion(), CATALOG), 'invoicingMethod')).toBe(
      'FAC-1 — Factura electrónica',
    );
  });

  it('un código que no está, o un catálogo vacío, muestra el código solo y las mismas filas', () => {
    const unknown = sectionFields('B_REGIME_ACTIVITIES', makeVersion({ regimeCode: 'ZZZ' }), CATALOG);
    expect(valueOf(unknown, 'regime')).toBe('ZZZ');
    for (const section of SECTION_ORDER) {
      const withCatalog = sectionFields(section, makeVersion(), CATALOG);
      const without = sectionFields(section, makeVersion(), EMPTY);
      expect(without.map((r) => r.key)).toEqual(withCatalog.map((r) => r.key));
    }
    const a = sectionFields('A_RUT', makeVersion(), EMPTY);
    expect(itemsOf(a, 'rutResponsibilities')).toEqual(['R-01', 'R-02']);
  });

  it('el mismo código en dos tipos usa la etiqueta de su tipo', () => {
    const b = sectionFields('B_REGIME_ACTIVITIES', makeVersion({ regimeCode: 'X1' }), CATALOG);
    const c = sectionFields('C_VAT_INC', makeVersion({ vatConditionCode: 'X1' }), CATALOG);
    expect(valueOf(b, 'regime')).toBe('X1 — Etiqueta de régimen');
    expect(valueOf(c, 'vatCondition')).toBe('X1 — Etiqueta de IVA');
  });
});

describe('diffSection', () => {
  it('versiones iguales: ninguna fila cambiada', () => {
    for (const section of SECTION_ORDER) {
      const rows = diffSection(section, makeVersion(), makeVersion(), CATALOG);
      expect(rows.every((r) => !r.changed)).toBe(true);
    }
  });

  it('un solo campo distinto marca solo esa fila', () => {
    const rows = diffSection(
      'B_REGIME_ACTIVITIES',
      makeVersion({ regimeCode: 'REG-OLD' }),
      makeVersion({ regimeCode: 'REG-A' }),
      CATALOG,
    );
    expect(rows.filter((r) => r.changed).map((r) => r.key)).toEqual(['regime']);
  });

  it('null frente a cadena vacía no es cambio', () => {
    const rows = diffSection(
      'G_GROWTH_CAPACITY',
      makeVersion({ growthScenario: null }),
      makeVersion({ growthScenario: '' }),
      CATALOG,
    );
    expect(rows.every((r) => !r.changed)).toBe(true);
  });

  it('listas: agregado, quitado y cambiado (CA-11)', () => {
    const older = makeVersion({
      activities: [
        { ciiuCode: '4711', description: 'Comercio', main: true },
        { ciiuCode: '5611', description: null, main: false },
      ],
    });
    const current = makeVersion({
      activities: [
        { ciiuCode: '4711', description: 'Comercio al por menor', main: true },
        { ciiuCode: '6201', description: 'Software', main: false },
      ],
    });
    const rows = diffSection('B_REGIME_ACTIVITIES', older, current, CATALOG);
    const activities = diffRow(rows, 'activities');
    if (activities.kind !== 'list') throw new Error('no es lista');
    expect(activities.changed).toBe(true);
    expect(activities.items.map((i) => [i.key, i.status])).toEqual([
      ['4711', 'changed'],
      ['6201', 'added'],
      ['5611', 'removed'],
    ]);
    const changed = activities.items[0];
    expect(changed.before).toContain('Comercio');
    expect(changed.after).toContain('Comercio al por menor');
  });

  it('listas: la misma ciiuCode con otro main es cambio', () => {
    const older = makeVersion({ activities: [{ ciiuCode: '4711', description: null, main: false }] });
    const current = makeVersion({ activities: [{ ciiuCode: '4711', description: null, main: true }] });
    const activities = diffRow(diffSection('B_REGIME_ACTIVITIES', older, current, CATALOG), 'activities');
    if (activities.kind !== 'list') throw new Error('no es lista');
    expect(activities.items[0].status).toBe('changed');
  });

  it('ingresos: otro monto es cambio y un periodo nuevo es agregado', () => {
    const base = makeVersion().incomeReports[0];
    const older = makeVersion({ incomeReports: [base] });
    const current = makeVersion({
      incomeReports: [
        { ...base, amountCents: 5 },
        { ...base, periodStart: '2026-04-01', periodEnd: '2026-06-30' },
      ],
    });
    const income = diffRow(diffSection('E_INCOME', older, current, CATALOG), 'income');
    if (income.kind !== 'list') throw new Error('no es lista');
    expect(income.items.map((i) => i.status)).toEqual(['changed', 'added']);
  });

  it('responsabilidad quitada: removed por su código', () => {
    const older = makeVersion({ rutResponsibilityCodes: ['R-01', 'R-02'] });
    const current = makeVersion({ rutResponsibilityCodes: ['R-01'] });
    const list = diffRow(diffSection('A_RUT', older, current, CATALOG), 'rutResponsibilities');
    if (list.kind !== 'list') throw new Error('no es lista');
    expect(list.items.map((i) => [i.key, i.status])).toEqual([
      ['R-01', 'same'],
      ['R-02', 'removed'],
    ]);
  });

  it('h) asesor en la anterior y no en la vigente: la fila de alcance cuenta como cambiada', () => {
    const older = makeVersion({ hasAccountingAdvisor: true, advisorScope: 'Declaraciones' });
    const current = makeVersion({ hasAccountingAdvisor: false });
    const rows = diffSection('H_ADVISORY', older, current, CATALOG);
    expect(diffRow(rows, 'advisorScope').changed).toBe(true);
    expect(diffRow(rows, 'hasAdvisor').changed).toBe(true);
  });

  it('con el mismo catálogo un código igual no es cambio y uno distinto sí', () => {
    const same = diffSection('B_REGIME_ACTIVITIES', makeVersion(), makeVersion(), CATALOG);
    expect(diffRow(same, 'regime').changed).toBe(false);
    const other = diffSection(
      'B_REGIME_ACTIVITIES',
      makeVersion({ regimeCode: 'REG-OLD' }),
      makeVersion({ regimeCode: 'REG-A' }),
      CATALOG,
    );
    expect(diffRow(other, 'regime').changed).toBe(true);
    const noCatalog = diffSection('B_REGIME_ACTIVITIES', makeVersion(), makeVersion(), EMPTY);
    expect(diffRow(noCatalog, 'regime').changed).toBe(false);
  });
});

describe('comparableVersions', () => {
  const v = (versionNumber: number): VersionSummary => ({
    versionNumber,
    submittedAt: '2026-01-01T00:00:00Z',
  });

  it('las distintas de la vigente, de la más reciente a la más antigua', () => {
    expect(comparableVersions([v(3), v(2), v(1)], 3).map((x) => x.versionNumber)).toEqual([2, 1]);
  });

  it('una sola versión: vacío', () => {
    expect(comparableVersions([v(1)], 1)).toEqual([]);
  });

  it('entrada desordenada: sale descendente', () => {
    expect(comparableVersions([v(1), v(4), v(2), v(3)], 4).map((x) => x.versionNumber)).toEqual([3, 2, 1]);
  });
});
