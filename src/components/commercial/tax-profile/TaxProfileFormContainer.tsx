'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useEstablishments,
  useOnboardingDocuments,
  useTaxCatalog,
  useTaxProfile,
} from '@/hooks/commercial/useTaxProfile';
import { readApiError } from '@/lib/api/apiError';
import { vigentRutDocuments } from '@/lib/taxProfile/display';
import {
  emptyTaxProfileValues,
  fromVersionDetail,
  type FromVersionResult,
} from '@/lib/taxProfile/taxProfileSchema';
import type { TaxProfileResponse, TaxProfileSubmitRequest } from '@/types/commercial/TaxProfile.types';
import { TaxProfileForm } from './TaxProfileForm';

export type TaxProfileFormMode = 'onboarding' | 'profile';

const SUBMIT_LABELS: Record<TaxProfileFormMode, string> = {
  onboarding: 'Guardar y continuar',
  profile: 'Enviar ficha',
};

// Carga en paralelo ficha, catálogo, sedes y documentos del asistente, y arma los valores
// iniciales del formulario. Lo usan el paso del onboarding y la pantalla del perfil.
export function TaxProfileFormContainer({
  mode,
  onSaved,
  onCancel,
  confirmBeforeSubmit,
}: {
  mode: TaxProfileFormMode;
  onSaved: (response: TaxProfileResponse) => void | Promise<void>;
  onCancel?: () => void;
  confirmBeforeSubmit?: (request: TaxProfileSubmitRequest) => Promise<boolean>;
}) {
  const profile = useTaxProfile();
  const catalog = useTaxCatalog();
  const establishments = useEstablishments();
  const documents = useOnboardingDocuments();

  const rutDocuments = useMemo(
    () => vigentRutDocuments(documents.data?.documents ?? []),
    [documents.data],
  );

  const initial: FromVersionResult | null = useMemo(() => {
    if (profile.data === undefined || !catalog.data || !documents.data) return null;
    if (profile.data === null) {
      return { values: emptyTaxProfileValues(), staleCodes: [], staleRut: false };
    }
    return fromVersionDetail(profile.data.version, {
      catalog: catalog.data,
      vigentRutIds: rutDocuments.map((d) => d.id),
    });
  }, [profile.data, catalog.data, documents.data, rutDocuments]);

  const queries = [profile, catalog, establishments, documents];
  const failed = queries.filter((q) => q.isError);

  if (failed.length > 0) {
    const forbidden = failed.some((q) => readApiError(q.error).status === 403);
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5"
        role="alert"
      >
        <p className="text-sm font-semibold text-red-700">
          {forbidden
            ? 'No tienes permiso para ver esta información'
            : 'No pudimos cargar tu ficha tributaria'}
        </p>
        {!forbidden && (
          <button
            type="button"
            onClick={() => failed.forEach((q) => q.refetch())}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (!initial || establishments.isPending) {
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Cargando tu ficha tributaria">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <TaxProfileForm
      initialValues={initial.values}
      catalog={catalog.data ?? []}
      rutDocuments={rutDocuments}
      staleCodes={initial.staleCodes}
      staleRut={initial.staleRut}
      submitLabel={SUBMIT_LABELS[mode]}
      confirmBeforeSubmit={confirmBeforeSubmit}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
