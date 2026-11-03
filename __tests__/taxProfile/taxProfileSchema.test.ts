import { describe, expect, it } from 'vitest';
import {
  createTaxProfileSchema,
  sectionForField,
  type TaxProfileFormValues,
} from '@/lib/taxProfile/taxProfileSchema';

const TODAY = '2026-10-27';
const schema = createTaxProfileSchema({ today: TODAY });

const RN10 =
  'Si un total ya incluye las ventas de VERYGANA, no las informes otra vez por separado';

function baseValues(): TaxProfileFormValues {
  return {
    rutDocumentId: null,
    rutResponsibilityCodes: [],
    regimeCode: '',
    activities: [{ ciiuCode: '4711', description: '', main: true }],
    vatConditionCode: '',
    incConditionCode: '',
    taxConditionScope: '',
    invoicingObligated: true,
    invoicingMethodCode: '',
    invoicingNotes: '',
    withholdingAgent: false,
    withholdingNotes: '',
    incomeReports: [
      {
        concept: 'VENTAS',
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
        amount: '1500000',
        scope: 'EXTERNAL_ONLY',
        notes: '',
        supportDocumentId: null,
      },
    ],
    currentCapacity: 'Atiendo 50 pedidos por semana',
    growthScenario: '',
    growthMeasures: '',
    hasAccountingAdvisor: false,
    advisorScope: '',
  };
}

function issues(values: unknown): Record<string, string[]> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const out: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function withIncome(...rows: Array<Partial<TaxProfileFormValues['incomeReports'][number]>>) {
  const base = baseValues();
  const template = base.incomeReports[0];
  return { ...base, incomeReports: rows.map((r) => ({ ...template, ...r })) };
}

describe('createTaxProfileSchema', () => {
  it('el caso base es válido', () => {
    expect(issues(baseValues())).toEqual({});
  });

  describe('actividades', () => {
    it('sin actividades: error en activities', () => {
      const out = issues({ ...baseValues(), activities: [] });
      expect(out.activities).toBeDefined();
    });

    it('cero principales y dos principales: error en activities', () => {
      const none = issues({
        ...baseValues(),
        activities: [{ ciiuCode: '4711', description: '', main: false }],
      });
      expect(none.activities).toEqual(['Marca exactamente una actividad como principal']);
      const two = issues({
        ...baseValues(),
        activities: [
          { ciiuCode: '4711', description: '', main: true },
          { ciiuCode: '4712', description: '', main: true },
        ],
      });
      expect(two.activities).toEqual(['Marca exactamente una actividad como principal']);
    });

    it.each(['123', '12a4', '12345', ''])('CIIU "%s" inválido', (ciiuCode) => {
      const out = issues({
        ...baseValues(),
        activities: [{ ciiuCode, description: '', main: true }],
      });
      expect(out['activities.0.ciiuCode']).toContain('El CIIU tiene 4 dígitos');
    });

    it('CIIU repetido: error en la fila repetida (CA-5)', () => {
      const out = issues({
        ...baseValues(),
        activities: [
          { ciiuCode: '4711', description: '', main: true },
          { ciiuCode: '4711', description: '', main: false },
        ],
      });
      expect(out['activities.1.ciiuCode']).toEqual(['Este CIIU ya está en otra actividad']);
      expect(out['activities.0.ciiuCode']).toBeUndefined();
    });
  });

  describe('Sí/No sin valor inicial (CA-6)', () => {
    it('undefined pide elegir una opción', () => {
      const out = issues({
        ...baseValues(),
        invoicingObligated: undefined,
        withholdingAgent: undefined,
        hasAccountingAdvisor: undefined,
      });
      expect(out.invoicingObligated).toEqual(['Selecciona una opción']);
      expect(out.withholdingAgent).toEqual(['Selecciona una opción']);
      expect(out.hasAccountingAdvisor).toEqual(['Selecciona una opción']);
    });
  });

  describe('textos', () => {
    it('capacidad actual vacía o solo espacios', () => {
      expect(issues({ ...baseValues(), currentCapacity: '   ' }).currentCapacity).toBeDefined();
    });
    it('2001 caracteres: Máximo 2000 caracteres', () => {
      expect(issues({ ...baseValues(), currentCapacity: 'a'.repeat(2001) }).currentCapacity).toEqual([
        'Máximo 2000 caracteres',
      ]);
      expect(issues({ ...baseValues(), growthScenario: 'a'.repeat(2001) }).growthScenario).toEqual([
        'Máximo 2000 caracteres',
      ]);
      expect(issues({ ...baseValues(), growthMeasures: 'a'.repeat(2001) }).growthMeasures).toEqual([
        'Máximo 2000 caracteres',
      ]);
    });
    it('2000 caracteres es válido', () => {
      expect(issues({ ...baseValues(), currentCapacity: 'a'.repeat(2000) })).toEqual({});
    });
    it('1000 para alcance de IVA/INC, notas y asesoría', () => {
      const long = 'a'.repeat(1001);
      const out = issues({
        ...baseValues(),
        taxConditionScope: long,
        invoicingNotes: long,
        withholdingNotes: long,
        hasAccountingAdvisor: true,
        advisorScope: long,
      });
      for (const k of ['taxConditionScope', 'invoicingNotes', 'withholdingNotes', 'advisorScope']) {
        expect(out[k]).toEqual(['Máximo 1000 caracteres']);
      }
    });
    it('el alcance de la asesoría solo cuenta con "Sí": con "No" o sin elegir no bloquea', () => {
      const long = 'a'.repeat(1001);
      expect(issues({ ...baseValues(), hasAccountingAdvisor: false, advisorScope: long }).advisorScope)
        .toBeUndefined();
      expect(issues({ ...baseValues(), hasAccountingAdvisor: false, advisorScope: long })).toEqual({});
      expect(
        issues({ ...baseValues(), hasAccountingAdvisor: undefined, advisorScope: long }).advisorScope,
      ).toBeUndefined();
    });
    it('notas de periodo: Máximo 500 caracteres', () => {
      const out = issues(withIncome({ notes: 'a'.repeat(501) }));
      expect(out['incomeReports.0.notes']).toEqual(['Máximo 500 caracteres']);
    });
  });

  describe('periodos de ingresos', () => {
    it('sin periodos: error', () => {
      expect(issues({ ...baseValues(), incomeReports: [] }).incomeReports).toEqual([
        'Agrega al menos un periodo',
      ]);
    });
    it('fin anterior al inicio', () => {
      const out = issues(withIncome({ periodStart: '2026-05-01', periodEnd: '2026-04-30' }));
      expect(out['incomeReports.0.periodEnd']).toEqual([
        'El fin del periodo no puede ser anterior al inicio',
      ]);
    });
    it('fin posterior a hoy', () => {
      const out = issues(withIncome({ periodEnd: '2026-10-28' }));
      expect(out['incomeReports.0.periodEnd']).toEqual(['Informa solo periodos ya cerrados']);
      expect(issues(withIncome({ periodEnd: '2026-10-27' }))).toEqual({});
    });
    it('monto negativo', () => {
      expect(issues(withIncome({ amount: '-1' }))['incomeReports.0.amount']).toEqual([
        'El monto no puede ser negativo',
      ]);
    });
    it('monto con más de 2 decimales (D-1)', () => {
      expect(issues(withIncome({ amount: '1234,567' }))['incomeReports.0.amount']).toEqual([
        'Máximo 2 decimales',
      ]);
      expect(issues(withIncome({ amount: '1234,56' }))).toEqual({});
    });
    it('monto no numérico', () => {
      expect(issues(withIncome({ amount: 'abc' }))['incomeReports.0.amount']).toEqual([
        'Escribe el monto en pesos, por ejemplo 1500000 o 1234,56',
      ]);
    });
    it('campos obligatorios vacíos', () => {
      const out = issues(
        withIncome({ concept: '', scope: '', periodStart: '', periodEnd: '', amount: '' }),
      );
      for (const k of ['concept', 'scope', 'periodStart', 'periodEnd', 'amount']) {
        expect(out[`incomeReports.0.${k}`]).toBeDefined();
      }
    });
    it('solapamiento (CA-8): el texto de RN-10 en el alcance de ambas filas', () => {
      const out = issues(
        withIncome(
          {
            scope: 'CONSOLIDATED_INCLUDES_PLATFORM',
            periodStart: '2026-01-01',
            periodEnd: '2026-06-30',
          },
          { scope: 'EXTERNAL_ONLY', periodStart: '2026-03-01', periodEnd: '2026-03-31' },
        ),
      );
      expect(out['incomeReports.0.scope']).toEqual([RN10]);
      expect(out['incomeReports.1.scope']).toEqual([RN10]);
    });
    it('los mismos periodos sin cruzarse son válidos', () => {
      expect(
        issues(
          withIncome(
            {
              scope: 'CONSOLIDATED_INCLUDES_PLATFORM',
              periodStart: '2026-01-01',
              periodEnd: '2026-06-30',
            },
            { scope: 'EXTERNAL_ONLY', periodStart: '2026-07-01', periodEnd: '2026-07-31' },
          ),
        ),
      ).toEqual({});
    });
  });
});

describe('sectionForField', () => {
  it.each([
    ['rutDocumentId', 'A_RUT'],
    ['rutResponsibilityCodes', 'A_RUT'],
    ['regimeCode', 'B_REGIME_ACTIVITIES'],
    ['activities', 'B_REGIME_ACTIVITIES'],
    ['activities.0.ciiuCode', 'B_REGIME_ACTIVITIES'],
    ['vatConditionCode', 'C_VAT_INC'],
    ['incConditionCode', 'C_VAT_INC'],
    ['taxConditionScope', 'C_VAT_INC'],
    ['invoicingObligated', 'D_INVOICING_WITHHOLDING'],
    ['invoicingMethodCode', 'D_INVOICING_WITHHOLDING'],
    ['invoicingNotes', 'D_INVOICING_WITHHOLDING'],
    ['withholdingAgent', 'D_INVOICING_WITHHOLDING'],
    ['withholdingNotes', 'D_INVOICING_WITHHOLDING'],
    ['incomeReports.2.amount', 'E_INCOME'],
    ['incomeReports', 'E_INCOME'],
    ['currentCapacity', 'G_GROWTH_CAPACITY'],
    ['growthScenario', 'G_GROWTH_CAPACITY'],
    ['growthMeasures', 'G_GROWTH_CAPACITY'],
    ['hasAccountingAdvisor', 'H_ADVISORY'],
    ['advisorScope', 'H_ADVISORY'],
  ])('%s -> %s', (field, section) => {
    expect(sectionForField(field)).toBe(section);
  });

  it('campo desconocido: null', () => {
    expect(sectionForField('desconocido')).toBeNull();
  });
});

describe('soporte vigente de un periodo (CA-22, CA-23, RN-15)', () => {
  const NOT_VIGENT = 'Este documento ya no está vigente. Elige otro o «Sin soporte»';
  const FIELD = 'incomeReports.0.supportDocumentId';

  function supportIssues(
    supportDocumentId: number | null,
    vigentSupportIds?: ReadonlySet<number> | null,
  ) {
    const result = createTaxProfileSchema({ today: TODAY, vigentSupportIds }).safeParse(
      withIncome({ supportDocumentId }),
    );
    if (result.success) return {} as Record<string, string[]>;
    const out: Record<string, string[]> = {};
    for (const issue of result.error.issues) (out[issue.path.join('.')] ??= []).push(issue.message);
    return out;
  }

  it('un soporte que no está entre los vigentes da error en el campo', () => {
    expect(supportIssues(11, new Set([10]))[FIELD]).toEqual([NOT_VIGENT]);
  });

  it('un soporte vigente o null no da ese error', () => {
    expect(supportIssues(10, new Set([10]))[FIELD]).toBeUndefined();
    expect(supportIssues(null, new Set([10]))[FIELD]).toBeUndefined();
  });

  it('sin conjunto (null o sin el parámetro) no se comprueba: la lista pudo fallar', () => {
    expect(supportIssues(11, null)[FIELD]).toBeUndefined();
    expect(supportIssues(11)[FIELD]).toBeUndefined();
    expect(issues(withIncome({ supportDocumentId: 11 }))[FIELD]).toBeUndefined();
  });

  it('la sección e) se abre sola con ese campo', () => {
    expect(sectionForField(FIELD)).toBe('E_INCOME');
  });
});
