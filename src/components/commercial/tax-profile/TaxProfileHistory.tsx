'use client';

import { useState } from 'react';
import { useTaxCatalog, useTaxProfileVersion, useTaxProfileVersions } from '@/hooks/commercial/useTaxProfile';
import { readApiError } from '@/lib/api/apiError';
import { sortVersionsDesc } from '@/lib/taxProfile/display';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import { TaxProfileReadView } from './TaxProfileReadView';

function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
      <p className="text-sm text-red-700">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// Detalle de una versión anterior, en solo lectura y sin revisiones (CA-20).
function VersionDetail({ versionNumber }: { versionNumber: number }) {
  const version = useTaxProfileVersion(versionNumber);
  const catalog = useTaxCatalog();

  if (version.isPending || catalog.isPending) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" aria-label="Cargando la versión" />;
  }
  if (version.isError) {
    const status = readApiError(version.error).status;
    return status === 404 ? (
      <ErrorBox text="No encontramos esa versión" />
    ) : (
      <ErrorBox text="No pudimos cargar esa versión" onRetry={() => version.refetch()} />
    );
  }
  return <TaxProfileReadView version={version.data} catalog={catalog.data ?? []} />;
}

export function TaxProfileHistory() {
  const versions = useTaxProfileVersions({ enabled: true });
  const [selected, setSelected] = useState<number | null>(null);

  if (versions.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando el historial">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }
  if (versions.isError) {
    return <ErrorBox text="No pudimos cargar el historial" onRetry={() => versions.refetch()} />;
  }
  if (versions.data.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay versiones enviadas</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {sortVersionsDesc(versions.data).map((item) => {
          const active = item.versionNumber === selected;
          return (
            <li key={item.versionNumber}>
              <button
                type="button"
                onClick={() => setSelected(item.versionNumber)}
                aria-pressed={active}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'border-[#03548C] bg-blue-50 font-semibold text-[#03548C]'
                    : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                Versión {item.versionNumber} · enviada el {formatBogotaDateTime(item.submittedAt)}
              </button>
            </li>
          );
        })}
      </ul>
      {selected !== null && <VersionDetail versionNumber={selected} />}
    </div>
  );
}
