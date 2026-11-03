import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// Único sitio del código que lee `downloadUrl` (P-16): la URL firmada nunca se guarda en estado,
// en almacenamiento, en un href ni en una ruta del front.

// La URL firmada vale 5 minutos; se usa solo durante 4 (D-4).
export const DOWNLOAD_URL_MAX_AGE_MS = 4 * 60 * 1000;

export function isDownloadUrlFresh(fetchedAt: number, now: number): boolean {
  return fetchedAt > 0 && now - fetchedAt < DOWNLOAD_URL_MAX_AGE_MS;
}

// Lo mínimo que se usa de la ventana que devuelve `window.open`.
export interface OpenedWindow {
  opener: unknown;
  location: { replace: (url: string) => void };
  close: () => void;
}

export interface OpenExpedienteDocumentArgs {
  documentId: number;
  documents: readonly ExpedienteDocument[];
  // Momento en que se pidió la lista (`query.dataUpdatedAt`).
  fetchedAt: number;
  now: number;
  refetch: () => Promise<readonly ExpedienteDocument[] | undefined>;
  // Sin URL abre una pestaña vacía (en el mismo clic, para que no la bloqueen); con URL se abre con
  // `noopener,noreferrer`, así que el resultado puede ser null aunque la pestaña se haya abierto.
  openWindow: (url?: string) => OpenedWindow | null | undefined;
}

// Lo que se usa del resultado de `query.refetch()` de TanStack Query v5.
export interface RefetchResultLike {
  data: readonly ExpedienteDocument[] | undefined;
  isError: boolean;
  status: string;
  error?: unknown;
}

// `refetch()` de TanStack no rechaza si la lectura falla: devuelve el `data` anterior (con la
// `downloadUrl` vencida) y marca el error. Aquí se vuelve un rechazo para no abrir esa URL (CA-6).
export function documentsFromRefetch(result: RefetchResultLike): readonly ExpedienteDocument[] | undefined {
  if (result.isError || result.status === 'error') {
    throw new Error('No se pudo volver a pedir la lista del expediente');
  }
  return result.data;
}

const urlOf = (docs: readonly ExpedienteDocument[] | undefined, id: number): string | null =>
  docs?.find((d) => d.id === id)?.downloadUrl ?? null;

export async function openExpedienteDocument({
  documentId,
  documents,
  fetchedAt,
  now,
  refetch,
  openWindow,
}: OpenExpedienteDocumentArgs): Promise<'opened' | 'failed'> {
  const cached = urlOf(documents, documentId);
  if (cached && isDownloadUrlFresh(fetchedAt, now)) {
    // Con `noopener` el navegador devuelve siempre null: no se interpreta como fallo (desviación 4).
    openWindow(cached);
    return 'opened';
  }

  // CA-6: la URL puede estar vencida. La pestaña se abre ya y se redirige tras pedir la lista.
  const placeholder = openWindow() ?? null;
  if (placeholder) placeholder.opener = null;

  let fresh: string | null = null;
  try {
    fresh = urlOf(await refetch(), documentId);
  } catch {
    fresh = null;
  }

  if (!fresh) {
    placeholder?.close();
    return 'failed';
  }
  if (placeholder) {
    placeholder.location.replace(fresh);
    return 'opened';
  }
  openWindow(fresh);
  return 'opened';
}
