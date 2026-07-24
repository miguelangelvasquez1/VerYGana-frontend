import React, { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPE_LABELS,
  MAX_DOCUMENT_SIZE_BYTES,
  OnboardingDocument,
  OnboardingDocumentsResponse,
  OnboardingDocumentType,
  OnboardingService,
} from "@/services/commercial/OnboardingService";
import { extractApiError, StepButton } from "../onboarding.shared";

interface Props {
  data: OnboardingDocumentsResponse;
  submitting: boolean;
  onDataChange: (data: OnboardingDocumentsResponse) => void;
  onNext: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return "El archivo supera el tamaño máximo de 10MB";
  if (!ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type)) return "Formato no permitido. Usa PDF, JPG o PNG";
  return null;
}

export function DocumentsStep({ data, submitting, onDataChange, onNext }: Props) {
  const [uploadingType, setUploadingType] = useState<OnboardingDocumentType | null>(null);
  const [discardingId, setDiscardingId] = useState<number | null>(null);
  const inputRefs = useRef<Partial<Record<OnboardingDocumentType, HTMLInputElement | null>>>({});

  const documentFor = (type: OnboardingDocumentType): OnboardingDocument | undefined =>
    data.documents.find((d) => d.documentType === type);

  const handleFileSelected = async (documentType: OnboardingDocumentType, file: File | null) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploadingType(documentType);
    try {
      const { documentId, permission } = await OnboardingService.prepareDocumentUpload({
        documentType,
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      await OnboardingService.uploadDocumentFile(permission.uploadUrl, file);
      const updated = await OnboardingService.confirmDocumentUpload(documentId);
      onDataChange(updated);
      toast.success(`${file.name} subido correctamente`);
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setUploadingType(null);
    }
  };

  const handleDiscard = async (doc: OnboardingDocument) => {
    setDiscardingId(doc.id);
    try {
      const updated = await OnboardingService.discardDocument(doc.id);
      onDataChange(updated);
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setDiscardingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Carga documental</h3>
        <p className="text-sm text-gray-500">
          Sube los documentos requeridos para continuar. Formatos aceptados: PDF, JPG, PNG — máximo 10MB por archivo.
        </p>
      </div>

      <div className="space-y-3">
        {data.checklist.map((item) => {
          const doc = documentFor(item.documentType);
          const isUploading = uploadingType === item.documentType;
          const isDiscarding = doc && discardingId === doc.id;

          return (
            <div
              key={item.documentType}
              className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  item.uploaded ? "bg-green-100" : "bg-gray-200"
                }`}
              >
                {item.uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {DOCUMENT_TYPE_LABELS[item.documentType]}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {doc ? (
                  <p className="text-xs text-gray-500 truncate">
                    {doc.originalFileName} · {formatBytes(doc.sizeBytes)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">{item.required ? "Requerido" : "Opcional"}</p>
                )}
              </div>

              <input
                ref={(el) => { inputRefs.current[item.documentType] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  handleFileSelected(item.documentType, file);
                  e.target.value = "";
                }}
              />

              {doc ? (
                <button
                  type="button"
                  onClick={() => handleDiscard(doc)}
                  disabled={isDiscarding || isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition shrink-0 disabled:opacity-50"
                >
                  {isDiscarding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Eliminar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[item.documentType]?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#03548C] border border-[#03548C]/30 rounded-lg hover:bg-[#03548C]/5 transition shrink-0 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Subir
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!data.allRequiredUploaded && (
        <p className="text-xs text-gray-400 text-center">
          Sube todos los documentos requeridos para continuar.
        </p>
      )}

      <StepButton submitting={submitting} disabled={!data.allRequiredUploaded} onClick={onNext} />
    </div>
  );
}
