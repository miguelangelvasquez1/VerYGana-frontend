'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState } from 'react';

import { readApiError } from '@/lib/api/apiError';
import { FORMALIZATION_TEXTS } from '@/lib/labels/formalizationCommitment';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { useFormalizationCommitment } from '@/hooks/commercial/useFormalizationCommitment';

// Se carga solo al abrir "No acepto…": saca react-hook-form y zod del First Load JS del asistente.
const RefusalReasonDialog = dynamic(
  () => import('./RefusalReasonDialog').then((m) => m.RefusalReasonDialog),
  { ssr: false },
);

interface FormalizationCommitmentBlockProps {
  commitment: ReturnType<typeof useFormalizationCommitment>;
  submitting: boolean;
}

// Caja con scroll propio que muestra el texto completo, tal cual lo entrega la API.
function CommitmentTextBox({ fullText }: { fullText: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setOverflowing(box.scrollHeight > box.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [fullText]);

  return (
    <div>
      <div
        ref={boxRef}
        role="region"
        aria-label={FORMALIZATION_TEXTS.scrollRegionLabel}
        tabIndex={0}
        className="max-h-[50vh] overflow-y-auto whitespace-pre-line break-words rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03548C]"
      >
        {fullText}
      </div>
      {overflowing && (
        <p className="mt-1 text-xs text-gray-500">{FORMALIZATION_TEXTS.scrollHint}</p>
      )}
    </div>
  );
}

// Bloque "Hoja Final de Aceptación Electrónica" del paso de aprobación (spec 015).
// No bloquea la aprobación en ningún estado: el botón "Aprobar contrato" vive fuera.
export function FormalizationCommitmentBlock({
  commitment,
  submitting,
}: FormalizationCommitmentBlockProps) {
  const { query, state, dispatch, showEvidence } = commitment;
  const headingId = useId();
  const checkboxId = useId();
  const [dialogOpen, setDialogOpen] = useState(false);

  const view = query.data;
  const refused = state.decision === 'REFUSE';

  const renderBody = () => {
    if (query.isPending) {
      return (
        <div role="status" className="animate-pulse space-y-3">
          <span className="sr-only">{FORMALIZATION_TEXTS.loading}</span>
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-100" />
        </div>
      );
    }

    if (!view) {
      if (readApiError(query.error).status === 403) {
        return <p className="text-sm text-gray-600">{FORMALIZATION_TEXTS.forbidden}</p>;
      }
      return (
        <div role="alert" className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">{FORMALIZATION_TEXTS.loadError}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={submitting}
            className="text-sm font-semibold text-[#03548C] hover:underline disabled:opacity-50"
          >
            {FORMALIZATION_TEXTS.retry}
          </button>
          <p className="text-xs text-gray-500">{FORMALIZATION_TEXTS.loadErrorNote}</p>
        </div>
      );
    }

    const manifestation = view.manifestation;

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {FORMALIZATION_TEXTS.subtitle}{' '}
          <span className="text-gray-500">{FORMALIZATION_TEXTS.versionLabel(view.version)}</span>
        </p>
        <CommitmentTextBox fullText={view.fullText} />

        {showEvidence && manifestation ? (
          <p className="text-sm font-semibold text-emerald-700">
            {FORMALIZATION_TEXTS.evidence(
              formatBogotaDateTime(manifestation.occurredAt),
              manifestation.declarationVersion,
            )}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <input
                id={checkboxId}
                type="checkbox"
                checked={state.decision === 'ACCEPT'}
                onChange={(e) => dispatch({ type: 'toggleAccept', checked: e.target.checked })}
                disabled={submitting || refused}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#03548C] disabled:cursor-not-allowed"
              />
              <label htmlFor={checkboxId} className="text-sm text-gray-800">
                {FORMALIZATION_TEXTS.checkboxLabel}
              </label>
            </div>
            {refused ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  {FORMALIZATION_TEXTS.refusedChip}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'undoRefusal' })}
                  disabled={submitting}
                  className="text-sm font-semibold text-[#03548C] hover:underline disabled:opacity-50"
                >
                  {FORMALIZATION_TEXTS.undo}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                disabled={submitting}
                className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
              >
                {FORMALIZATION_TEXTS.refuseLink}
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">{FORMALIZATION_TEXTS.fixedNote}</p>
      </div>
    );
  };

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <h4 id={headingId} className="text-base font-bold text-gray-900">
        {FORMALIZATION_TEXTS.title}
      </h4>
      {renderBody()}
      {dialogOpen && (
        <RefusalReasonDialog
          open={dialogOpen}
          onConfirm={(reason) => {
            dispatch({ type: 'confirmRefusal', reason });
            setDialogOpen(false);
          }}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </section>
  );
}
