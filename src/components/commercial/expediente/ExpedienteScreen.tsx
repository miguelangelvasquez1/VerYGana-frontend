'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

import { useExpediente } from '@/hooks/commercial/useExpediente';
import { readApiError } from '@/lib/api/apiError';
import { addableDocumentTypes, groupExpediente, shouldShowLoadError } from '@/lib/expediente/expediente';
import { documentsFromRefetch, openExpedienteDocument } from '@/lib/expediente/openDocument';
import { EXPEDIENTE_TEXTS as T } from '@/lib/labels/expedienteRequests';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';
import { ExpedienteDocumentGroup } from './ExpedienteDocumentGroup';
import type { ExpedienteUploadTarget } from './ExpedienteUploadDialog';

// El diálogo se baja solo al abrirse.
const ExpedienteUploadDialog = dynamic(
  () => import('./ExpedienteUploadDialog').then((m) => m.ExpedienteUploadDialog),
  { ssr: false },
);

const primaryButton =
  'rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#023e69]';

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status">
      <span className="sr-only">{T.loadingSr}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" aria-hidden="true" />
      ))}
    </div>
  );
}

// Pantalla del expediente documental del empresario (/commercial/profile/documents).
export function ExpedienteScreen() {
  const query = useExpediente();
  const [target, setTarget] = useState<ExpedienteUploadTarget | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const documents = query.data;
  const groups = useMemo(() => groupExpediente(documents ?? []), [documents]);
  const addable = useMemo(() => addableDocumentTypes(documents ?? []), [documents]);

  // "Ver": la URL firmada vive solo en la caché de Query; la lógica está en openDocument.ts (CA-6).
  const handleView = async (doc: ExpedienteDocument) => {
    if (viewingId !== null) return;
    setViewingId(doc.id);
    try {
      const result = await openExpedienteDocument({
        documentId: doc.id,
        documents: documents ?? [],
        fetchedAt: query.dataUpdatedAt,
        now: Date.now(),
        refetch: async () => documentsFromRefetch(await query.refetch()),
        openWindow: (url) =>
          url ? window.open(url, '_blank', 'noopener,noreferrer') : window.open('', '_blank'),
      });
      if (result === 'failed') toast.error(T.openFailed);
    } finally {
      setViewingId(null);
    }
  };

  if (query.isPending) return <LoadingSkeleton />;

  if (shouldShowLoadError(query.isError, query.data)) {
    const forbidden = readApiError(query.error).status === 403;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <p className="text-sm font-semibold text-red-700">{forbidden ? T.forbidden : T.loadError}</p>
        {!forbidden && (
          <button
            type="button"
            onClick={() => query.refetch()}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            {T.retry}
          </button>
        )}
      </div>
    );
  }

  const addButton =
    addable.length > 0 ? (
      <button type="button" onClick={() => setTarget({ kind: 'add', types: addable })} className={primaryButton}>
        {T.addDocument}
      </button>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {query.isError && (
        <p className="text-xs text-amber-700" role="status">
          {T.refreshFailed}
        </p>
      )}
      {groups.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">{T.empty}</p>
          {addButton}
        </div>
      ) : (
        <>
          {addButton && <div className="flex sm:justify-end">{addButton}</div>}
          {groups.map((group) => (
            <ExpedienteDocumentGroup
              key={group.type}
              group={group}
              viewingId={viewingId}
              onView={handleView}
              onReplace={(document) => setTarget({ kind: 'replace', document })}
            />
          ))}
        </>
      )}

      {target && (
        <ExpedienteUploadDialog
          open
          target={target}
          onClose={() => setTarget(null)}
          onUploaded={() => {
            setTarget(null);
            toast.success(T.uploaded);
          }}
        />
      )}
    </div>
  );
}
