'use client';

import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/shared/Dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTaxCatalog, useTaxProfile } from '@/hooks/commercial/useTaxProfile';
import { readApiError } from '@/lib/api/apiError';
import { TAX_PROFILE_STATUS_LABELS } from '@/lib/labels/taxCompliance';
import { nextVersionMessage } from '@/lib/taxProfile/display';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { TaxProfileResponse } from '@/types/commercial/TaxProfile.types';
import { CommitmentBlock } from './CommitmentBlock';
import { TaxProfileFormContainer } from './TaxProfileFormContainer';
import { TaxProfileHistory } from './TaxProfileHistory';
import { TaxProfileReadView } from './TaxProfileReadView';

type Tab = 'current' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'current', label: 'Ficha actual' },
  { id: 'history', label: 'Historial' },
];

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando tu ficha tributaria">
      <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

const primaryButton =
  'rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#023e69]';

export function TaxInfoScreen() {
  const profile = useTaxProfile();
  const catalog = useTaxCatalog();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('current');
  const [confirming, setConfirming] = useState(false);
  const confirmResolver = useRef<((accepted: boolean) => void) | null>(null);

  // Abre el diálogo y espera la decisión; el formulario envía solo si se confirma (CA-19).
  const confirmBeforeSubmit = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      setConfirming(true);
    });
  }, []);

  const answerConfirm = (accepted: boolean) => {
    confirmResolver.current?.(accepted);
    confirmResolver.current = null;
    setConfirming(false);
  };

  const handleSaved = (response: TaxProfileResponse) => {
    toast.success(`Ficha enviada. Versión ${response.currentVersion}`);
    setEditing(false);
    setTab('current');
  };

  if (profile.isPending) return <LoadingSkeleton />;

  if (profile.isError) {
    const forbidden = readApiError(profile.error).status === 403;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <p className="text-sm font-semibold text-red-700">
          {forbidden
            ? 'No tienes permiso para ver esta información'
            : 'No pudimos cargar tu ficha tributaria'}
        </p>
        {!forbidden && (
          <button
            type="button"
            onClick={() => profile.refetch()}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const data = profile.data;

  // Sin ficha (204): "Completar ficha" sin confirmación previa (D-2).
  if (data === null) {
    if (editing) {
      return <TaxProfileFormContainer mode="profile" onSaved={handleSaved} onCancel={() => setEditing(false)} />;
    }
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">Aún no has diligenciado tu ficha tributaria</p>
        <button type="button" onClick={() => setEditing(true)} className={primaryButton}>
          Completar ficha
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <>
        <TaxProfileFormContainer
          mode="profile"
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
          confirmBeforeSubmit={confirmBeforeSubmit}
        />
        <Dialog open={confirming} title="Enviar nueva versión" onClose={() => answerConfirm(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">{nextVersionMessage(data.currentVersion)}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => answerConfirm(false)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button type="button" onClick={() => answerConfirm(true)} className={primaryButton}>
                Confirmar
              </button>
            </div>
          </div>
        </Dialog>
      </>
    );
  }

  const status = TAX_PROFILE_STATUS_LABELS[data.status];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Información tributaria" className="flex gap-2 border-b border-gray-200">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tax-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`tax-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === item.id
                ? 'border-[#03548C] text-[#03548C]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'current' ? (
        <div
          role="tabpanel"
          id="tax-panel-current"
          aria-labelledby="tax-tab-current"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={status.label} tone={status.tone} />
                <span className="text-sm font-semibold text-gray-900">Versión {data.currentVersion}</span>
              </div>
              <p className="text-sm text-gray-500">Actualizada el {formatBogotaDateTime(data.updatedAt)}</p>
            </div>
            <button type="button" onClick={() => setEditing(true)} className={primaryButton}>
              Editar ficha
            </button>
          </div>

          {data.status === 'OBSERVED' && (
            <p
              className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium text-orange-800"
              role="status"
            >
              VERYGANA dejó observaciones en tu ficha. Corrígelas y envía una nueva versión
            </p>
          )}

          <TaxProfileReadView
            version={data.version}
            catalog={catalog.data ?? []}
            reviews={data.sectionReviews}
          />
          <CommitmentBlock manifestation={data.formalizationCommitment} />
        </div>
      ) : (
        <div role="tabpanel" id="tax-panel-history" aria-labelledby="tax-tab-history">
          <TaxProfileHistory />
        </div>
      )}
    </div>
  );
}
