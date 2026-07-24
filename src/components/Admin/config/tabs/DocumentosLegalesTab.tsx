'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  LEGAL_DOCUMENT_TYPES,
  LEGAL_DOCUMENT_TYPE_LABELS,
  LegalDocument,
  LegalDocumentType,
} from '@/services/LegalDocumentsService';
import {
  LEGAL_DOCUMENT_MIME_TYPE,
  MAX_LEGAL_DOCUMENT_SIZE_BYTES,
  MAX_RETAINED_VERSIONS,
  confirmLegalDocumentUpload,
  discardLegalDocumentUpload,
  prepareLegalDocumentUpload,
  uploadLegalDocumentFile,
} from '@/services/admin/AdminLegalDocumentsService';
import {
  useInvalidateLegalDocuments,
  useLegalDocumentHistory,
  useLegalDocuments,
} from '@/hooks/legal/legalDocumentsQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractApiError(err: unknown): { message: string; details: Record<string, string> } {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  return {
    message: data?.message || 'Ocurrió un error. Intenta de nuevo.',
    details: (data?.details && typeof data.details === 'object' ? data.details : {}) as Record<string, string>,
  };
}

// ─── Historial modal ────────────────────────────────────────────────────────

function HistoryModal({ type, onClose }: { type: LegalDocumentType; onClose: () => void }) {
  const { data: history = [], isLoading, isError, refetch } = useLegalDocumentHistory(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Historial de versiones</h2>
            <p className="text-xs text-gray-400 mt-0.5">{LEGAL_DOCUMENT_TYPE_LABELS[type]}</p>
          </div>
          <button onClick={onClose} className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={17} />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-red-500">
              <AlertTriangle size={20} />
              <p className="text-sm font-medium">Error al cargar el historial.</p>
              <button onClick={() => refetch()} className="text-xs text-blue-600 hover:underline">Reintentar</button>
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Ningún tipo con versiones publicadas todavía.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((doc) => (
                <li
                  key={doc.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                    doc.active ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">v{doc.version}</span>
                      {doc.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          Vigente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Publicado el {formatDate(doc.publishedDate)}</p>
                  </div>
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Ver <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Publicar nueva versión ─────────────────────────────────────────────────

type UploadStage = 'idle' | 'preparing' | 'uploading' | 'confirming';

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: 'Publicar',
  preparing: 'Preparando...',
  uploading: 'Subiendo archivo...',
  confirming: 'Confirmando...',
};

function PublishModal({
  initialType,
  documents,
  onClose,
  onPublished,
}: {
  initialType: LegalDocumentType;
  documents: LegalDocument[];
  onClose: () => void;
  onPublished: () => void;
}) {
  // El tipo se infiere de la fila desde la que se abrió el modal — no es editable aquí.
  const type = initialType;
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<UploadStage>('idle');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Documento creado por prepare-upload que aún no se confirmó — si el
  // usuario cambia de archivo, cierra el formulario o el confirm falla, hay
  // que descartarlo (borra el registro pendiente + el archivo en R2).
  const pendingDocumentIdRef = useRef<number | null>(null);

  const invalidate = useInvalidateLegalDocuments();
  const { data: history = [] } = useLegalDocumentHistory(type);

  const currentActive = documents.find((d) => d.type === type);
  const requiresConfirmation = !!currentActive;
  const isPending = stage !== 'idle';
  const nearRetentionLimit = history.length >= MAX_RETAINED_VERSIONS;

  const discardPending = () => {
    if (pendingDocumentIdRef.current) {
      const id = pendingDocumentIdRef.current;
      pendingDocumentIdRef.current = null;
      discardLegalDocumentUpload(id).catch(() => { /* best effort */ });
    }
  };

  useEffect(() => {
    return () => discardPending();
  }, []);

  const handleClose = () => {
    discardPending();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    discardPending();
    setErrors((p) => ({ ...p, file: '' }));
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== LEGAL_DOCUMENT_MIME_TYPE) {
      setErrors((p) => ({ ...p, file: 'Solo se aceptan archivos PDF.' }));
      setFile(null);
      e.target.value = '';
      return;
    }
    if (f.size > MAX_LEGAL_DOCUMENT_SIZE_BYTES) {
      setErrors((p) => ({ ...p, file: 'El archivo supera el tamaño máximo de 10MB.' }));
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!file) {
      setErrors({ file: 'Selecciona un archivo PDF' });
      return;
    }
    if (requiresConfirmation && !confirmReplace) {
      toast.error('Confirma que entiendes que esto reemplazará la versión vigente.');
      return;
    }

    try {
      setStage('preparing');
      const { documentId, permission } = await prepareLegalDocumentUpload({
        type,
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      pendingDocumentIdRef.current = documentId;

      setStage('uploading');
      await uploadLegalDocumentFile(permission.uploadUrl, file);

      setStage('confirming');
      const result = await confirmLegalDocumentUpload(documentId);
      pendingDocumentIdRef.current = null;

      toast.success(`Nueva versión publicada: ${LEGAL_DOCUMENT_TYPE_LABELS[type]} v${result.version}`);
      invalidate(type);
      onPublished();
    } catch (err) {
      discardPending();
      const { message, details } = extractApiError(err);
      if (Object.keys(details).length > 0) setErrors(details);
      toast.error(message);
    } finally {
      setStage('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={!isPending ? handleClose : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UploadCloud size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Publicar nueva versión</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tipo de documento</label>
            <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium">
              {LEGAL_DOCUMENT_TYPE_LABELS[type]}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Archivo PDF <span className="text-gray-400 normal-case font-normal">(máx. 10MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPending}
            />
            {file ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <FileText size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { discardPending(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  disabled={isPending}
                  className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed text-sm font-semibold transition disabled:opacity-50 ${
                  errors.file
                    ? 'border-red-300 text-red-500 hover:bg-red-50'
                    : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Upload size={15} />
                Seleccionar PDF
              </button>
            )}
            {errors.file && <p className="text-xs text-red-600 mt-1">{errors.file}</p>}
          </div>

          {nearRetentionLimit && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <Clock size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Este tipo ya tiene {history.length} versiones publicadas (máximo {MAX_RETAINED_VERSIONS}).
                Al confirmar esta subida se eliminará automáticamente la más antigua.
              </p>
            </div>
          )}

          {requiresConfirmation && currentActive && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReplace}
                  onChange={(e) => setConfirmReplace(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 shrink-0"
                />
                <span className="text-xs text-amber-800 leading-relaxed">
                  Esto reemplazará la versión vigente <strong>v{currentActive.version}</strong>. La
                  acción es irreversible desde aquí — para volver a esa versión habría que
                  publicarla de nuevo.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || (requiresConfirmation && !confirmReplace)}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {STAGE_LABELS[stage]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab principal ───────────────────────────────────────────────────────────

export default function DocumentosLegalesTab() {
  const { data: documents = [], isLoading, isError, refetch } = useLegalDocuments();
  const [historyType, setHistoryType] = useState<LegalDocumentType | null>(null);
  const [publishType, setPublishType] = useState<LegalDocumentType | null>(null);

  const findActive = (type: LegalDocumentType): LegalDocument | undefined =>
    documents.find((d) => d.type === type);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <Loader2 size={18} className="animate-spin text-blue-500" />
        <span className="text-sm">Cargando documentos legales...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">No se pudieron cargar los documentos legales</p>
          <p className="text-sm text-gray-500 mt-1">Verifica tu conexión o intenta de nuevo.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Versiones vigentes de los documentos legales. Publicar una nueva versión desactiva
        automáticamente la anterior del mismo tipo.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Versión activa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Publicado el</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LEGAL_DOCUMENT_TYPES.map((type) => {
                const active = findActive(type);
                return (
                  <tr key={type} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{LEGAL_DOCUMENT_TYPE_LABELS[type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {active ? (
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          v{active.version}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Sin publicar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {active ? formatDate(active.publishedDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {active ? (
                        <a
                          href={active.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-semibold"
                        >
                          Ver PDF <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setHistoryType(type)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <History size={13} />
                          Historial
                        </button>
                        <button
                          onClick={() => setPublishType(type)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <UploadCloud size={13} />
                          Publicar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Clock size={12} />
        Los tipos sin versión publicada aún no tienen documento activo hasta la primera publicación.
      </p>

      {historyType && (
        <HistoryModal type={historyType} onClose={() => setHistoryType(null)} />
      )}

      {publishType && (
        <PublishModal
          initialType={publishType}
          documents={documents}
          onClose={() => setPublishType(null)}
          onPublished={() => setPublishType(null)}
        />
      )}
    </div>
  );
}
