'use client';

import { useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useExpediente } from '@/hooks/commercial/useExpediente';
import { useSubmitTaxProfile } from '@/hooks/commercial/useTaxProfile';
import { readApiError, toFormFieldPath } from '@/lib/api/apiError';
import { TAX_PROFILE_SECTION_TITLES } from '@/lib/labels/taxCompliance';
import { vigentSupportIds } from '@/lib/expediente/expediente';
import { groupCatalog } from '@/lib/taxProfile/catalog';
import {
  createTaxProfileSchema,
  sectionForField,
  toSubmitRequest,
  type TaxProfileFormValues,
} from '@/lib/taxProfile/taxProfileSchema';
import { todayInBogota } from '@/lib/utils/dateDisplay';
import type {
  CatalogEntry,
  TaxProfileResponse,
  TaxProfileSection,
  TaxProfileSubmitRequest,
} from '@/types/commercial/TaxProfile.types';
import { CollapsibleSection } from './CollapsibleSection';
import { CommitmentTextDialog } from './CommitmentTextDialog';
import type { FieldName } from './FormFields';
import { AdvisorySection } from './sections/AdvisorySection';
import { EstablishmentsSummarySection } from './sections/EstablishmentsSummarySection';
import { GrowthSection } from './sections/GrowthSection';
import { IncomeSection } from './sections/IncomeSection';
import { InvoicingSection } from './sections/InvoicingSection';
import { RegimeActivitiesSection } from './sections/RegimeActivitiesSection';
import { RutSection, type RutDocumentOption } from './sections/RutSection';
import { VatIncSection } from './sections/VatIncSection';

const SECTIONS = Object.keys(TAX_PROFILE_SECTION_TITLES) as TaxProfileSection[];

const INFO_TEXT =
  'Esta ficha recoge tu información tributaria tal como la declaras. Incluye también tus actividades e ingresos fuera de VERYGANA. VERYGANA puede revisarla y pedirte soportes; esa revisión no es asesoría contable o tributaria.';

const DEFAULT_SAVE_ERROR = 'No pudimos guardar tu ficha. Intenta de nuevo';

// Rutas de los campos con error (hojas del árbol de errores de react-hook-form).
function collectErrorPaths(errors: unknown, prefix = ''): string[] {
  if (typeof errors !== 'object' || errors === null) return [];
  const record = errors as Record<string, unknown>;
  if (typeof record.message === 'string' && 'type' in record) return prefix ? [prefix] : [];
  const paths: string[] = [];
  for (const key of Object.keys(record)) {
    if (key === 'ref') continue;
    paths.push(...collectErrorPaths(record[key], prefix ? `${prefix}.${key}` : key));
  }
  return paths;
}

function sectionsWithErrors(errors: FieldErrors<TaxProfileFormValues>): Set<TaxProfileSection> {
  const sections = new Set<TaxProfileSection>();
  for (const path of collectErrorPaths(errors)) {
    const section = sectionForField(path);
    if (section) sections.add(section);
  }
  return sections;
}

export interface TaxProfileFormProps {
  initialValues: TaxProfileFormValues;
  catalog: readonly CatalogEntry[];
  rutDocuments: readonly RutDocumentOption[];
  // Ayudas de D-3: códigos de la versión anterior que ya no están vigentes.
  staleCodes?: readonly string[];
  staleRut?: boolean;
  submitLabel: string;
  // Pide confirmación antes de enviar (el perfil avisa de la versión nueva). `false` cancela.
  confirmBeforeSubmit?: (request: TaxProfileSubmitRequest) => Promise<boolean>;
  onSaved: (response: TaxProfileResponse) => void | Promise<void>;
  onCancel?: () => void;
}

export function TaxProfileForm({
  initialValues,
  catalog,
  rutDocuments,
  staleCodes = [],
  staleRut = false,
  submitLabel,
  confirmBeforeSubmit,
  onSaved,
  onCancel,
}: TaxProfileFormProps) {
  const submitMutation = useSubmitTaxProfile();
  // RN-15: los documentos no bloquean la ficha; si la consulta tarda o falla no se comprueba el soporte.
  const expediente = useExpediente();
  const vigentIdsRef = useRef<ReadonlySet<number> | null>(null);
  vigentIdsRef.current =
    expediente.status === 'success' && expediente.data ? vigentSupportIds(expediente.data) : null;
  const grouped = useMemo(() => groupCatalog(catalog), [catalog]);
  const [openSections, setOpenSections] = useState<Record<TaxProfileSection, boolean>>(() => ({
    A_RUT: true,
    B_REGIME_ACTIVITIES: false,
    C_VAT_INC: false,
    D_INVOICING_WITHHOLDING: false,
    E_INCOME: false,
    F_ESTABLISHMENTS: false,
    G_GROWTH_CAPACITY: false,
    H_ADVISORY: false,
  }));

  // El esquema se arma en cada validación: "hoy" en Colombia no queda fijo si la pantalla
  // se deja abierta pasada la medianoche.
  const resolver: Resolver<TaxProfileFormValues> = (values, context, options) =>
    zodResolver(
      createTaxProfileSchema({ today: todayInBogota(), vigentSupportIds: vigentIdsRef.current }),
    )(values, context, options);

  const form = useForm<TaxProfileFormValues>({
    resolver,
    defaultValues: initialValues,
  });
  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = form;

  const errorSections = sectionsWithErrors(errors);

  const openAndFocus = (sections: Iterable<TaxProfileSection>, firstPath?: string) => {
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const section of sections) next[section] = true;
      return next;
    });
    if (firstPath) {
      // Espera a que la sección se muestre: un campo oculto no recibe el foco.
      setTimeout(() => setFocus(firstPath as FieldName), 0);
    }
  };

  const onInvalid = (invalid: FieldErrors<TaxProfileFormValues>) => {
    const sections = sectionsWithErrors(invalid);
    openAndFocus(sections, collectErrorPaths(invalid)[0]);
  };

  const onValid = async (values: TaxProfileFormValues) => {
    const request = toSubmitRequest(values);
    if (confirmBeforeSubmit && !(await confirmBeforeSubmit(request))) return;

    let response: TaxProfileResponse;
    try {
      response = await submitMutation.mutateAsync(request);
    } catch (error) {
      const { message, details } = readApiError(error);
      const unplaced: string[] = [];
      const sections = new Set<TaxProfileSection>();
      let firstPath: string | undefined;
      for (const [key, text] of Object.entries(details ?? {})) {
        const path = toFormFieldPath(key);
        const section = sectionForField(path);
        if (section) {
          setError(path as FieldName, { type: 'server', message: text });
          sections.add(section);
          firstPath ??= path;
        } else {
          unplaced.push(text);
        }
      }
      toast.error([message ?? DEFAULT_SAVE_ERROR, ...unplaced].join('. '));
      openAndFocus(sections, firstPath);
      return;
    }
    await onSaved(response);
  };

  const busy = isSubmitting || submitMutation.isPending;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="flex flex-col gap-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p>{INFO_TEXT}</p>
          <div className="mt-2">
            <CommitmentTextDialog linkText="Leer el compromiso de formalización" />
          </div>
        </div>

        {(staleCodes.length > 0 || staleRut) && (
          <ul className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {staleRut && <li>El RUT de la versión anterior ya no está vigente</li>}
            {staleCodes.map((code) => (
              <li key={code}>
                El código {code} ya no está vigente. Elige otro o deja el campo vacío
              </li>
            ))}
          </ul>
        )}

        {SECTIONS.map((section) => (
          <CollapsibleSection
            key={section}
            id={`tax-section-${section}`}
            title={TAX_PROFILE_SECTION_TITLES[section]}
            open={openSections[section]}
            onToggle={() => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))}
            hasError={errorSections.has(section)}
          >
            {section === 'A_RUT' && (
              <RutSection rutDocuments={rutDocuments} responsibilities={grouped.RUT_RESPONSIBILITY} />
            )}
            {section === 'B_REGIME_ACTIVITIES' && <RegimeActivitiesSection regimes={grouped.REGIME} />}
            {section === 'C_VAT_INC' && (
              <VatIncSection
                vatConditions={grouped.VAT_CONDITION}
                incConditions={grouped.INC_CONDITION}
              />
            )}
            {section === 'D_INVOICING_WITHHOLDING' && (
              <InvoicingSection invoicingMethods={grouped.INVOICING_METHOD} />
            )}
            {section === 'E_INCOME' && (
              <IncomeSection documentsStatus={expediente.status} documents={expediente.data} />
            )}
            {section === 'F_ESTABLISHMENTS' && <EstablishmentsSummarySection />}
            {section === 'G_GROWTH_CAPACITY' && <GrowthSection />}
            {section === 'H_ADVISORY' && <AdvisorySection />}
          </CollapsibleSection>
        ))}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar edición
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#03548C] px-6 py-3 text-sm font-bold text-white hover:bg-[#023e69] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Enviando…' : submitLabel}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
