import { useCallback, useRef, useState } from "react";
import { confirmAssetUpload, prepareAssetUpload } from "@/services/PqrsService";
import { fileUploadService } from "@/services/FileUploadService";
import { PqrsAssetResponseDTO } from "@/types/Pqrs.types";

export const ACCEPTED_EVIDENCE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
] as const;
export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;
export const EVIDENCE_ACCEPT_ATTR = ACCEPTED_EVIDENCE_TYPES.join(",");

export type PqrsEvidenceStatus = "preparing" | "uploading" | "ready" | "error";

export interface PqrsEvidenceItem {
  localId: string;
  file: File;
  status: PqrsEvidenceStatus;
  progress: number;
  error: string;
  previewUrl: string;
  asset: PqrsAssetResponseDTO | null;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response?.data;
  if (typeof data?.message === "string" && data.message) return data.message;
  return fallback;
}

function validate(file: File, currentCount: number): string | null {
  if (currentCount >= MAX_EVIDENCE_FILES) {
    return `Solo puedes adjuntar hasta ${MAX_EVIDENCE_FILES} archivos.`;
  }
  if (!ACCEPTED_EVIDENCE_TYPES.includes(file.type as (typeof ACCEPTED_EVIDENCE_TYPES)[number])) {
    return "Formato no admitido. Usa PNG, JPEG, WEBP, MP4 o MOV.";
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    return "El archivo pesa más de 25 MB.";
  }
  return null;
}

/**
 * Sube evidencia de un PQRS antes de crearlo: prepara el permiso, hace el PUT
 * directo a storage y confirma, todo por archivo. Los `assetId` confirmados
 * son lo único que se manda luego en el POST de creación del PQRS.
 */
export function usePqrsEvidenceUpload() {
  const [items, setItems] = useState<PqrsEvidenceItem[]>([]);
  const idCounter = useRef(0);

  const patchItem = (localId: string, patch: Partial<PqrsEvidenceItem>) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
  };

  const uploadOne = useCallback(async (localId: string, file: File) => {
    try {
      patchItem(localId, { status: "preparing", progress: 0, error: "" });
      const { assetId, permission } = await prepareAssetUpload({
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });

      patchItem(localId, { status: "uploading" });
      await fileUploadService.uploadToR2(permission.uploadUrl, file, (progress) =>
        patchItem(localId, { progress }),
      );

      const asset = await confirmAssetUpload(assetId);
      patchItem(localId, { status: "ready", progress: 100, asset });
    } catch (err) {
      patchItem(localId, {
        status: "error",
        progress: 0,
        error: apiErrorMessage(err, "No se pudo subir el archivo."),
      });
    }
  }, []);

  /** Devuelve los mensajes de los archivos rechazados en el cliente (formato/tamaño/cupo), para que quien llame los muestre. */
  const addFiles = useCallback(
    (files: FileList | File[]): string[] => {
      const fileArray = Array.from(files);
      let count = items.length;
      const accepted: { localId: string; file: File }[] = [];
      const rejected: string[] = [];

      for (const file of fileArray) {
        const invalid = validate(file, count);
        if (invalid) {
          rejected.push(invalid);
          continue;
        }
        count += 1;
        idCounter.current += 1;
        accepted.push({ localId: `evidence-${idCounter.current}`, file });
      }

      const newItems: PqrsEvidenceItem[] = accepted.map(({ localId, file }) => ({
        localId,
        file,
        status: "preparing",
        progress: 0,
        error: "",
        previewUrl: URL.createObjectURL(file),
        asset: null,
      }));

      setItems((prev) => [...prev, ...newItems]);
      accepted.forEach(({ localId, file }) => uploadOne(localId, file));

      return rejected;
    },
    [items.length, uploadOne],
  );

  const remove = useCallback((localId: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.localId !== localId);
    });
  }, []);

  const retry = useCallback(
    (localId: string) => {
      setItems((prev) => {
        const target = prev.find((it) => it.localId === localId);
        if (target) uploadOne(localId, target.file);
        return prev;
      });
    },
    [uploadOne],
  );

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => URL.revokeObjectURL(it.previewUrl));
      return [];
    });
  }, []);

  const assetIds = items.filter((it) => it.status === "ready" && it.asset).map((it) => it.asset!.id);
  const busy = items.some((it) => it.status === "preparing" || it.status === "uploading");
  const canAddMore = items.length < MAX_EVIDENCE_FILES;

  return { items, addFiles, remove, retry, clear, assetIds, busy, canAddMore };
}
