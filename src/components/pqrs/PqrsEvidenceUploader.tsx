"use client";

import { useRef } from "react";
import { Loader2, Paperclip, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  EVIDENCE_ACCEPT_ATTR,
  MAX_EVIDENCE_FILES,
  usePqrsEvidenceUpload,
} from "@/hooks/pqrs/usePqrsEvidenceUpload";

interface Props {
  evidence: ReturnType<typeof usePqrsEvidenceUpload>;
}

const PqrsEvidenceUploader = ({ evidence }: Props) => {
  const { items, addFiles, remove, retry, canAddMore } = evidence;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const rejected = addFiles(files);
    rejected.forEach((message) => toast.error(message));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Evidencia <span className="text-gray-400 font-normal">(opcional)</span>
      </label>

      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {items.map((item) => (
            <div key={item.localId} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {item.file.type.startsWith("video/") ? (
                <video src={item.previewUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
              )}

              {(item.status === "preparing" || item.status === "uploading") && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={18} className="text-white animate-spin" />
                </div>
              )}

              {item.status === "error" && (
                <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => retry(item.localId)}
                    title={item.error}
                    className="text-white cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => remove(item.localId)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors cursor-pointer w-full justify-center"
        >
          <Paperclip size={14} />
          Adjuntar foto o video
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={EVIDENCE_ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-gray-400 mt-1">
        Hasta {MAX_EVIDENCE_FILES} archivos, máx. 25 MB c/u.
      </p>
    </div>
  );
};

export default PqrsEvidenceUploader;
