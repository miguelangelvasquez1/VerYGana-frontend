import { EXPEDIENTE_TEXTS as T } from '@/lib/labels/expedienteRequests';
import { COMMERCIAL_DOCUMENT_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import type {
  CommercialDocumentType,
  ExpedienteDocument,
} from '@/types/commercial/Expediente.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export interface ExpedienteGroup {
  type: CommercialDocumentType;
  current: ExpedienteDocument[];
  history: ExpedienteDocument[];
}

// Orden de los grupos: el de las claves del diccionario.
const TYPE_ORDER = Object.keys(COMMERCIAL_DOCUMENT_TYPE_LABELS) as CommercialDocumentType[];

const time = (iso: string | null): number => {
  const parsed = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const newestUploadFirst = (a: ExpedienteDocument, b: ExpedienteDocument) =>
  time(b.uploadedAt) - time(a.uploadedAt);

// CA-1: vigentes (VALIDATED) arriba y reemplazados (SUPERSEDED) en el historial.
// PENDING y ORPHANED nunca se muestran. Si hubiera varios vigentes de un tipo, todos van arriba (D-6).
export function groupExpediente(docs: readonly ExpedienteDocument[]): ExpedienteGroup[] {
  return TYPE_ORDER.flatMap((type) => {
    const ofType = docs.filter((d) => d.documentType === type);
    const current = ofType.filter((d) => d.status === 'VALIDATED').sort(newestUploadFirst);
    const history = ofType
      .filter((d) => d.status === 'SUPERSEDED')
      .sort((a, b) => time(b.supersededAt) - time(a.supersededAt));
    return current.length === 0 && history.length === 0 ? [] : [{ type, current, history }];
  });
}

// CA-3: "Agregar documento" solo ofrece tipos sin vigente.
export function addableDocumentTypes(docs: readonly ExpedienteDocument[]): CommercialDocumentType[] {
  const withCurrent = new Set(docs.filter((d) => d.status === 'VALIDATED').map((d) => d.documentType));
  return TYPE_ORDER.filter((type) => !withCurrent.has(type));
}

// CA-12: el vigente más reciente de un tipo, el que reemplaza una carga desde un ítem.
export function currentDocumentOfType(
  docs: readonly ExpedienteDocument[],
  type: CommercialDocumentType,
): ExpedienteDocument | null {
  const current = docs
    .filter((d) => d.documentType === type && d.status === 'VALIDATED')
    .sort(newestUploadFirst);
  return current[0] ?? null;
}

// Nombre de archivo por id, incluidos los reemplazados (la conversación los cita).
export function documentNameById(docs: readonly ExpedienteDocument[]): Map<number, string> {
  return new Map(docs.map((d) => [d.id, d.originalFileName]));
}

export function vigentSupportIds(docs: readonly ExpedienteDocument[]): Set<number> {
  return new Set(docs.filter((d) => d.status === 'VALIDATED').map((d) => d.id));
}

export interface SupportOption {
  value: number | null;
  label: string;
  stale?: true;
}

export interface SupportSelectorState {
  disabled: boolean;
  note: string | null;
  options: SupportOption[];
}

// RN-15: opciones del selector de soporte de un periodo de ingresos.
export function supportSelectorState({
  status,
  documents,
  currentId,
}: {
  status: 'pending' | 'error' | 'success';
  documents: readonly ExpedienteDocument[] | undefined;
  currentId: number | null;
}): SupportSelectorState {
  const none: SupportOption = { value: null, label: T.supportNone };

  if (status !== 'success' || !documents) {
    // D-5: con la lista en carga o caída, un soporte ya guardado se conserva.
    const options: SupportOption[] =
      currentId === null ? [none] : [none, { value: currentId, label: T.supportSaved }];
    return status === 'pending'
      ? { disabled: true, note: T.supportLoading, options }
      : { disabled: false, note: T.supportLoadError, options };
  }

  const vigent = documents
    .filter((d) => d.status === 'VALIDATED')
    .map<SupportOption>((d) => ({
      value: d.id,
      label: T.supportOptionLabel(COMMERCIAL_DOCUMENT_TYPE_LABELS[d.documentType], d.originalFileName),
    }));
  const options: SupportOption[] = [none, ...vigent];
  if (currentId !== null && !vigent.some((o) => o.value === currentId)) {
    options.push({ value: currentId, label: T.supportStale, stale: true });
  }
  return { disabled: false, note: null, options };
}

// La vista de error reemplaza la pantalla solo si no hay datos que mostrar: un refetch fallido con
// la lista ya cargada la conserva (S9).
export function shouldShowLoadError(isError: boolean, data: unknown): boolean {
  return isError && data === undefined;
}
