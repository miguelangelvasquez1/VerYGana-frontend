import { z } from 'zod';
import { EXPEDIENTE_TEXTS } from '@/lib/labels/expedienteRequests';
import { centsToPesosInput, parsePesosInput, pesosToCents } from '@/lib/money/cents';
import { findIncomeOverlaps } from '@/lib/taxProfile/incomeOverlap';
import type {
  CatalogEntry,
  TaxCatalogType,
  TaxProfileSection,
  TaxProfileSubmitRequest,
  TaxProfileVersionDetail,
} from '@/types/commercial/TaxProfile.types';

const REQUIRED = 'Campo obligatorio';
const CHOOSE = 'Selecciona una opción';
export const OVERLAP_MESSAGE =
  'Si un total ya incluye las ventas de VERYGANA, no las informes otra vez por separado';

const maxChars = (n: number) => z.string().max(n, `Máximo ${n} caracteres`);

// Sí/No sin valor inicial (RN-7): `undefined` es "todavía no eligió".
const yesNo = z.boolean().optional().refine((v) => v !== undefined, { error: CHOOSE });

const activitySchema = z.object({
  ciiuCode: z.string().regex(/^\d{4}$/, 'El CIIU tiene 4 dígitos'),
  description: maxChars(300),
  main: z.boolean(),
});

const amountSchema = z.string().superRefine((text, ctx) => {
  if (text.trim() === '') {
    ctx.addIssue({ code: 'custom', message: REQUIRED });
    return;
  }
  const parsed = parsePesosInput(text);
  if (parsed.kind === 'negative') {
    ctx.addIssue({ code: 'custom', message: 'El monto no puede ser negativo' });
  } else if (parsed.kind === 'invalid') {
    ctx.addIssue({
      code: 'custom',
      message: 'Escribe el monto en pesos, por ejemplo 1500000 o 1234,56',
    });
  } else if (parsed.decimals > 2) {
    ctx.addIssue({ code: 'custom', message: 'Máximo 2 decimales' });
  }
});

const incomeSchema = z.object({
  concept: z.enum(['', 'INGRESOS', 'VENTAS', 'RECAUDOS']).refine((v) => v !== '', { error: REQUIRED }),
  periodStart: z.string().min(1, REQUIRED),
  periodEnd: z.string().min(1, REQUIRED),
  amount: amountSchema,
  scope: z
    .enum(['', 'EXTERNAL_ONLY', 'PLATFORM_ONLY', 'CONSOLIDATED_INCLUDES_PLATFORM'])
    .refine((v) => v !== '', { error: REQUIRED }),
  notes: maxChars(500),
  // Oculto (RN-11): null en filas nuevas, el de la versión al precargar.
  supportDocumentId: z.number().nullable(),
});

const taxProfileObject = z.object({
  // a) RUT
  rutDocumentId: z.number().nullable(),
  rutResponsibilityCodes: z.array(z.string()),
  // b) Régimen y actividades
  regimeCode: z.string(),
  activities: z.array(activitySchema).min(1, 'Agrega al menos una actividad'),
  // c) IVA e INC
  vatConditionCode: z.string(),
  incConditionCode: z.string(),
  taxConditionScope: maxChars(1000),
  // d) Facturación y retención
  invoicingObligated: yesNo,
  invoicingMethodCode: z.string(),
  invoicingNotes: maxChars(1000),
  withholdingAgent: yesNo,
  withholdingNotes: maxChars(1000),
  // e) Ingresos o ventas
  incomeReports: z.array(incomeSchema).min(1, 'Agrega al menos un periodo'),
  // g) Capacidad de crecimiento
  currentCapacity: z
    .string()
    .refine((v) => v.trim().length > 0, { error: 'Describe lo que puedes atender hoy' })
    .max(2000, 'Máximo 2000 caracteres'),
  growthScenario: maxChars(2000),
  growthMeasures: maxChars(2000),
  // h) Asesoría
  hasAccountingAdvisor: yesNo,
  // El límite se valida en el superRefine, solo con "Sí" (el alcance oculto no bloquea).
  advisorScope: z.string(),
});

export type TaxProfileFormValues = z.input<typeof taxProfileObject>;

// `today` (AAAA-MM-DD, hora de Colombia) se inyecta para poder probar con una fecha fija.
// `vigentSupportIds` (RN-15): ids de los documentos vigentes del expediente. Con `null` o sin él
// no se comprueba el soporte (CA-23: si la lista de documentos falló, no bloquea el envío).
export function createTaxProfileSchema({
  today,
  vigentSupportIds = null,
}: {
  today: string;
  vigentSupportIds?: ReadonlySet<number> | null;
}) {
  return taxProfileObject.superRefine((values, ctx) => {
    const { activities, incomeReports } = values;

    if (values.hasAccountingAdvisor === true && values.advisorScope.length > 1000) {
      ctx.addIssue({
        code: 'custom',
        path: ['advisorScope'],
        message: 'Máximo 1000 caracteres',
      });
    }

    const mainCount =activities.filter((a) => a.main).length;
    if (activities.length > 0 && mainCount !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['activities'],
        message: 'Marca exactamente una actividad como principal',
      });
    }

    const seen = new Set<string>();
    activities.forEach((activity, index) => {
      const code = activity.ciiuCode.trim();
      if (code === '') return;
      if (seen.has(code)) {
        ctx.addIssue({
          code: 'custom',
          path: ['activities', index, 'ciiuCode'],
          message: 'Este CIIU ya está en otra actividad',
        });
      }
      seen.add(code);
    });

    incomeReports.forEach((row, index) => {
      if (
        vigentSupportIds !== null &&
        row.supportDocumentId !== null &&
        !vigentSupportIds.has(row.supportDocumentId)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['incomeReports', index, 'supportDocumentId'],
          message: EXPEDIENTE_TEXTS.supportNotVigent,
        });
      }
      if (!row.periodStart || !row.periodEnd) return;
      if (row.periodEnd < row.periodStart) {
        ctx.addIssue({
          code: 'custom',
          path: ['incomeReports', index, 'periodEnd'],
          message: 'El fin del periodo no puede ser anterior al inicio',
        });
      } else if (row.periodEnd > today) {
        ctx.addIssue({
          code: 'custom',
          path: ['incomeReports', index, 'periodEnd'],
          message: 'Informa solo periodos ya cerrados',
        });
      }
    });

    for (const index of findIncomeOverlaps(incomeReports)) {
      ctx.addIssue({
        code: 'custom',
        path: ['incomeReports', index, 'scope'],
        message: OVERLAP_MESSAGE,
      });
    }
  });
}

export function emptyTaxProfileValues(): TaxProfileFormValues {
  return {
    rutDocumentId: null,
    rutResponsibilityCodes: [],
    regimeCode: '',
    activities: [{ ciiuCode: '', description: '', main: false }],
    vatConditionCode: '',
    incConditionCode: '',
    taxConditionScope: '',
    invoicingObligated: undefined,
    invoicingMethodCode: '',
    invoicingNotes: '',
    withholdingAgent: undefined,
    withholdingNotes: '',
    incomeReports: [
      {
        concept: '',
        periodStart: '',
        periodEnd: '',
        amount: '',
        scope: '',
        notes: '',
        supportDocumentId: null,
      },
    ],
    currentCapacity: '',
    growthScenario: '',
    growthMeasures: '',
    hasAccountingAdvisor: undefined,
    advisorScope: '',
  };
}

const orNull = (value: string): string | null => (value === '' ? null : value);

// Un texto opcional vacío no se envía.
function optionalText<K extends string>(key: K, value: string): Partial<Record<K, string>> {
  const trimmed = value.trim();
  return trimmed === '' ? {} : ({ [key]: trimmed } as Record<K, string>);
}

// Formulario -> cuerpo del PUT. Se llama con valores ya validados por el esquema.
export function toSubmitRequest(values: TaxProfileFormValues): TaxProfileSubmitRequest {
  const hasAdvisor = values.hasAccountingAdvisor === true;
  return {
    rutDocumentId: values.rutDocumentId ?? null,
    rutResponsibilityCodes: values.rutResponsibilityCodes,
    regimeCode: orNull(values.regimeCode),
    activities: values.activities.map((a) => ({
      ciiuCode: a.ciiuCode.trim(),
      ...optionalText('description', a.description),
      main: a.main,
    })),
    vatConditionCode: orNull(values.vatConditionCode),
    incConditionCode: orNull(values.incConditionCode),
    ...optionalText('taxConditionScope', values.taxConditionScope),
    invoicingObligated: values.invoicingObligated === true,
    invoicingMethodCode: orNull(values.invoicingMethodCode),
    ...optionalText('invoicingNotes', values.invoicingNotes),
    withholdingAgent: values.withholdingAgent === true,
    ...optionalText('withholdingNotes', values.withholdingNotes),
    incomeReports: values.incomeReports.map((r) => {
      const amountCents = pesosToCents(r.amount);
      if (amountCents === null || r.concept === '' || r.scope === '') {
        throw new Error('Periodo de ingresos sin validar');
      }
      return {
        concept: r.concept,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        amountCents,
        currency: 'COP',
        scope: r.scope,
        supportDocumentId: r.supportDocumentId,
        ...optionalText('notes', r.notes),
      };
    }),
    currentCapacity: values.currentCapacity.trim(),
    ...optionalText('growthScenario', values.growthScenario),
    ...optionalText('growthMeasures', values.growthMeasures),
    hasAccountingAdvisor: hasAdvisor,
    ...(hasAdvisor ? optionalText('advisorScope', values.advisorScope) : {}),
  };
}

export interface FromVersionResult {
  values: TaxProfileFormValues;
  // Códigos de la versión que ya no están en el catálogo vigente: arrancan vacíos (D-3).
  staleCodes: string[];
  // El RUT de la versión ya no es un RUT vigente: arranca sin elegir (D-3).
  staleRut: boolean;
}

// Versión guardada -> valores del formulario (CA-4): centavos a pesos, null a vacío.
export function fromVersionDetail(
  detail: TaxProfileVersionDetail,
  { catalog, vigentRutIds }: { catalog: readonly CatalogEntry[]; vigentRutIds: readonly number[] },
): FromVersionResult {
  const staleCodes: string[] = [];

  const vigentCode = (type: TaxCatalogType, code: string | null): string => {
    if (!code) return '';
    const found = catalog.some((e) => e.catalogType === type && e.code === code && e.active);
    if (found) return code;
    staleCodes.push(code);
    return '';
  };

  const rutResponsibilityCodes = detail.rutResponsibilityCodes.filter((code) => {
    const found = catalog.some(
      (e) => e.catalogType === 'RUT_RESPONSIBILITY' && e.code === code && e.active,
    );
    if (!found) staleCodes.push(code);
    return found;
  });

  const staleRut = detail.rutDocumentId !== null && !vigentRutIds.includes(detail.rutDocumentId);

  return {
    values: {
      rutDocumentId: staleRut ? null : detail.rutDocumentId,
      rutResponsibilityCodes,
      regimeCode: vigentCode('REGIME', detail.regimeCode),
      activities: detail.activities.map((a) => ({
        ciiuCode: a.ciiuCode,
        description: a.description ?? '',
        main: a.main,
      })),
      vatConditionCode: vigentCode('VAT_CONDITION', detail.vatConditionCode),
      incConditionCode: vigentCode('INC_CONDITION', detail.incConditionCode),
      taxConditionScope: detail.taxConditionScope ?? '',
      invoicingObligated: detail.invoicingObligated,
      invoicingMethodCode: vigentCode('INVOICING_METHOD', detail.invoicingMethodCode),
      invoicingNotes: detail.invoicingNotes ?? '',
      withholdingAgent: detail.withholdingAgent,
      withholdingNotes: detail.withholdingNotes ?? '',
      incomeReports: detail.incomeReports.map((r) => ({
        concept: r.concept,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        amount: centsToPesosInput(r.amountCents),
        scope: r.scope,
        notes: r.notes ?? '',
        supportDocumentId: r.supportDocumentId,
      })),
      currentCapacity: detail.currentCapacity,
      growthScenario: detail.growthScenario ?? '',
      growthMeasures: detail.growthMeasures ?? '',
      hasAccountingAdvisor: detail.hasAccountingAdvisor,
      advisorScope: detail.advisorScope ?? '',
    },
    staleCodes,
    staleRut,
  };
}

const SECTION_BY_FIELD: Record<string, TaxProfileSection> = {
  rutDocumentId: 'A_RUT',
  rutResponsibilityCodes: 'A_RUT',
  regimeCode: 'B_REGIME_ACTIVITIES',
  activities: 'B_REGIME_ACTIVITIES',
  vatConditionCode: 'C_VAT_INC',
  incConditionCode: 'C_VAT_INC',
  taxConditionScope: 'C_VAT_INC',
  invoicingObligated: 'D_INVOICING_WITHHOLDING',
  invoicingMethodCode: 'D_INVOICING_WITHHOLDING',
  invoicingNotes: 'D_INVOICING_WITHHOLDING',
  withholdingAgent: 'D_INVOICING_WITHHOLDING',
  withholdingNotes: 'D_INVOICING_WITHHOLDING',
  incomeReports: 'E_INCOME',
  currentCapacity: 'G_GROWTH_CAPACITY',
  growthScenario: 'G_GROWTH_CAPACITY',
  growthMeasures: 'G_GROWTH_CAPACITY',
  hasAccountingAdvisor: 'H_ADVISORY',
  advisorScope: 'H_ADVISORY',
};

// Sección a la que pertenece un campo del formulario (por la primera parte de su ruta).
export function sectionForField(path: string): TaxProfileSection | null {
  const root = path.split(/[.[]/)[0];
  return SECTION_BY_FIELD[root] ?? null;
}
