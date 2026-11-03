import { describe, expect, it } from 'vitest';
import {
  emptyTaxProfileValues,
  fromVersionDetail,
  toSubmitRequest,
  type TaxProfileFormValues,
} from '@/lib/taxProfile/taxProfileSchema';
import type { CatalogEntry, TaxProfileVersionDetail } from '@/types/commercial/TaxProfile.types';

// Datos ficticios: ningún código real.
const entry = (
  id: number,
  catalogType: CatalogEntry['catalogType'],
  code: string,
  active = true,
): CatalogEntry => ({
  id,
  catalogType,
  code,
  label: `Etiqueta ${code}`,
  legalBasis: 'Base de prueba',
  validFrom: '2026-01-01',
  validTo: null,
  active,
});

const CATALOG: CatalogEntry[] = [
  entry(1, 'REGIME', 'R-99'),
  entry(2, 'RUT_RESPONSIBILITY', 'RR-1'),
  entry(3, 'RUT_RESPONSIBILITY', 'RR-2'),
  entry(4, 'VAT_CONDITION', 'V-1'),
  entry(5, 'INC_CONDITION', 'I-1'),
  entry(6, 'INVOICING_METHOD', 'M-1'),
];

function detail(overrides: Partial<TaxProfileVersionDetail> = {}): TaxProfileVersionDetail {
  return {
    versionNumber: 3,
    submittedAt: '2026-10-01T10:00:00Z',
    rutDocumentId: 11,
    rutResponsibilityCodes: ['RR-1', 'RR-2'],
    regimeCode: 'R-99',
    activities: [
      { ciiuCode: '4711', description: 'Venta', main: true },
      { ciiuCode: '4712', description: null, main: false },
    ],
    vatConditionCode: 'V-1',
    incConditionCode: 'I-1',
    taxConditionScope: 'Productos',
    invoicingObligated: true,
    invoicingMethodCode: 'M-1',
    invoicingNotes: null,
    withholdingAgent: false,
    withholdingNotes: 'Nota',
    incomeReports: [
      {
        concept: 'VENTAS',
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
        amountCents: 123456,
        currency: 'COP',
        scope: 'EXTERNAL_ONLY',
        supportDocumentId: 7,
        notes: null,
      },
      {
        concept: 'INGRESOS',
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
        amountCents: 150000000,
        currency: 'COP',
        scope: 'PLATFORM_ONLY',
        supportDocumentId: null,
        notes: 'Nota de periodo',
      },
    ],
    establishmentsCount: 2,
    currentCapacity: 'Capacidad',
    growthScenario: null,
    growthMeasures: 'Medidas',
    hasAccountingAdvisor: true,
    advisorScope: 'Contabilidad',
    ...overrides,
  };
}

const OPTS = { catalog: CATALOG, vigentRutIds: [11] };

function filled(overrides: Partial<TaxProfileFormValues> = {}): TaxProfileFormValues {
  return { ...fromVersionDetail(detail(), OPTS).values, ...overrides };
}

describe('emptyTaxProfileValues', () => {
  it('una actividad y un periodo en blanco, Sí/No sin valor (CA-6)', () => {
    const v = emptyTaxProfileValues();
    expect(v.activities).toHaveLength(1);
    expect(v.activities[0]).toEqual({ ciiuCode: '', description: '', main: false });
    expect(v.incomeReports).toHaveLength(1);
    expect(v.incomeReports[0].amount).toBe('');
    expect(v.incomeReports[0].supportDocumentId).toBeNull();
    expect(v.invoicingObligated).toBeUndefined();
    expect(v.withholdingAgent).toBeUndefined();
    expect(v.hasAccountingAdvisor).toBeUndefined();
  });
  it('devuelve objetos nuevos cada vez', () => {
    expect(emptyTaxProfileValues().activities).not.toBe(emptyTaxProfileValues().activities);
  });
});

describe('toSubmitRequest', () => {
  it('monto 1234,56 -> 123456 centavos (CA-9)', () => {
    const body = toSubmitRequest(
      filled({
        incomeReports: [{ ...filled().incomeReports[0], amount: '1234,56' }],
      }),
    );
    expect(body.incomeReports[0].amountCents).toBe(123456);
  });

  it("códigos '' -> null (CA-10)", () => {
    const body = toSubmitRequest(
      filled({ regimeCode: '', vatConditionCode: '', incConditionCode: '', invoicingMethodCode: '' }),
    );
    expect(body.regimeCode).toBeNull();
    expect(body.vatConditionCode).toBeNull();
    expect(body.incConditionCode).toBeNull();
    expect(body.invoicingMethodCode).toBeNull();
  });

  it('RUT sin elegir -> rutDocumentId null (CA-11)', () => {
    expect(toSubmitRequest(filled({ rutDocumentId: null })).rutDocumentId).toBeNull();
    expect(toSubmitRequest(filled()).rutDocumentId).toBe(11);
  });

  it('sin asesor, el alcance no se envía aunque tenga texto (CA-14)', () => {
    const body = toSubmitRequest(filled({ hasAccountingAdvisor: false, advisorScope: 'texto' }));
    expect(body.hasAccountingAdvisor).toBe(false);
    expect(body).not.toHaveProperty('advisorScope');
    expect(toSubmitRequest(filled()).advisorScope).toBe('Contabilidad');
  });

  it('textos opcionales vacíos se omiten', () => {
    const body = toSubmitRequest(
      filled({
        taxConditionScope: '  ',
        invoicingNotes: '',
        withholdingNotes: '',
        growthScenario: '',
        growthMeasures: '',
        activities: [{ ciiuCode: '4711', description: '', main: true }],
        incomeReports: [{ ...filled().incomeReports[0], notes: '' }],
      }),
    );
    for (const k of ['taxConditionScope', 'invoicingNotes', 'withholdingNotes', 'growthScenario', 'growthMeasures']) {
      expect(body).not.toHaveProperty(k);
    }
    expect(body.activities[0]).not.toHaveProperty('description');
    expect(body.incomeReports[0]).not.toHaveProperty('notes');
  });

  it("moneda 'COP' y supportDocumentId conservado (RN-11)", () => {
    const body = toSubmitRequest(filled());
    expect(body.incomeReports.every((r) => r.currency === 'COP')).toBe(true);
    expect(body.incomeReports[0].supportDocumentId).toBe(7);
    expect(body.incomeReports[1].supportDocumentId).toBeNull();
  });
});

describe('fromVersionDetail', () => {
  it('centavos a pesos con coma, booleanos y actividades tal cual, null a vacío (CA-4)', () => {
    const { values } = fromVersionDetail(detail(), OPTS);
    expect(values.incomeReports[0].amount).toBe('1234,56');
    expect(values.incomeReports[1].amount).toBe('1500000');
    expect(values.invoicingObligated).toBe(true);
    expect(values.withholdingAgent).toBe(false);
    expect(values.hasAccountingAdvisor).toBe(true);
    expect(values.activities).toEqual([
      { ciiuCode: '4711', description: 'Venta', main: true },
      { ciiuCode: '4712', description: '', main: false },
    ]);
    expect(values.invoicingNotes).toBe('');
    expect(values.growthScenario).toBe('');
    expect(values.incomeReports[0].notes).toBe('');
    expect(values.incomeReports[0].supportDocumentId).toBe(7);
  });

  it('todo vigente: sin avisos', () => {
    const r = fromVersionDetail(detail(), OPTS);
    expect(r.staleCodes).toEqual([]);
    expect(r.staleRut).toBe(false);
    expect(r.values.regimeCode).toBe('R-99');
    expect(r.values.rutDocumentId).toBe(11);
  });

  it('código fuera del catálogo y RUT no vigente arrancan vacíos y se informan (D-3)', () => {
    const r = fromVersionDetail(
      detail({
        regimeCode: 'R-VIEJO',
        vatConditionCode: 'V-1',
        rutResponsibilityCodes: ['RR-1', 'RR-VIEJO'],
        rutDocumentId: 99,
      }),
      OPTS,
    );
    expect(r.values.regimeCode).toBe('');
    expect(r.values.vatConditionCode).toBe('V-1');
    expect(r.values.rutResponsibilityCodes).toEqual(['RR-1']);
    expect(r.values.rutDocumentId).toBeNull();
    expect(r.staleCodes.sort()).toEqual(['R-VIEJO', 'RR-VIEJO']);
    expect(r.staleRut).toBe(true);
  });

  it('una entrada retirada (active false) cuenta como no vigente', () => {
    const catalog = [...CATALOG.filter((e) => e.code !== 'R-99'), entry(9, 'REGIME', 'R-99', false)];
    const r = fromVersionDetail(detail(), { catalog, vigentRutIds: [11] });
    expect(r.values.regimeCode).toBe('');
    expect(r.staleCodes).toEqual(['R-99']);
  });

  it('un código de otro tipo de catálogo no vale', () => {
    const r = fromVersionDetail(detail({ regimeCode: 'V-1' }), OPTS);
    expect(r.values.regimeCode).toBe('');
    expect(r.staleCodes).toEqual(['V-1']);
  });

  it('rutDocumentId nulo no es un aviso', () => {
    const r = fromVersionDetail(detail({ rutDocumentId: null }), OPTS);
    expect(r.staleRut).toBe(false);
    expect(r.values.rutDocumentId).toBeNull();
  });

  it('ida y vuelta reproduce los campos del envío', () => {
    const x = detail();
    const body = toSubmitRequest(fromVersionDetail(x, OPTS).values);
    expect(body).toEqual({
      rutDocumentId: 11,
      rutResponsibilityCodes: ['RR-1', 'RR-2'],
      regimeCode: 'R-99',
      activities: [
        { ciiuCode: '4711', description: 'Venta', main: true },
        { ciiuCode: '4712', main: false },
      ],
      vatConditionCode: 'V-1',
      incConditionCode: 'I-1',
      taxConditionScope: 'Productos',
      invoicingObligated: true,
      invoicingMethodCode: 'M-1',
      withholdingAgent: false,
      withholdingNotes: 'Nota',
      incomeReports: [
        {
          concept: 'VENTAS',
          periodStart: '2026-01-01',
          periodEnd: '2026-06-30',
          amountCents: 123456,
          currency: 'COP',
          scope: 'EXTERNAL_ONLY',
          supportDocumentId: 7,
        },
        {
          concept: 'INGRESOS',
          periodStart: '2026-01-01',
          periodEnd: '2026-06-30',
          amountCents: 150000000,
          currency: 'COP',
          scope: 'PLATFORM_ONLY',
          supportDocumentId: null,
          notes: 'Nota de periodo',
        },
      ],
      currentCapacity: 'Capacidad',
      growthMeasures: 'Medidas',
      hasAccountingAdvisor: true,
      advisorScope: 'Contabilidad',
    });
  });
});
