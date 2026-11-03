import type { CaseTabKey } from '@/lib/labels/complianceTaxReview';
import type { TaxCatalogType, TaxProfileStatus } from '@/types/commercial/TaxProfile.types';
import type { InformationRequestStatus } from '@/types/compliance/InformationRequest.types';
import { CATALOG_TYPES } from '@/lib/taxProfile/catalog';

// Sin 'use client' para poder importarse desde las pruebas de Vitest. Las URL se arman a mano,
// sin `URLSearchParams`: los valores son enums y enteros, nunca datos personales (RN-9).

export const TAX_PROFILES_PATH = '/compliance/tax-profiles';
export const COMMERCIAL_CASE_PATH = '/compliance/commercials';
export const QUEUE_PAGE_SIZE = 20;

export type QueueStatus = TaxProfileStatus | 'ALL';
export interface QueueState {
  status: QueueStatus;
  page: number; // base 1 (en la URL)
}

const DEFAULT_STATUS: QueueStatus = 'SUBMITTED';
const QUEUE_STATUSES: readonly QueueStatus[] = ['SUBMITTED', 'OBSERVED', 'REVIEWED', 'ALL'];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseQueueParams(searchParams: RawParams): QueueState {
  const rawStatus = first(searchParams.status);
  const status = QUEUE_STATUSES.find((s) => s === rawStatus) ?? DEFAULT_STATUS;
  const rawPage = first(searchParams.page);
  const page = rawPage !== undefined && /^[1-9]\d{0,8}$/.test(rawPage) ? Number(rawPage) : 1;
  return { status, page };
}

// Los valores por defecto no se escriben en la URL.
export function queuePath({ status, page }: QueueState): string {
  const parts: string[] = [];
  if (status !== DEFAULT_STATUS) parts.push(`status=${status}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `${TAX_PROFILES_PATH}?${parts.join('&')}` : TAX_PROFILES_PATH;
}

// Destino de "Anterior" cuando la página pedida no tiene filas: con `?page=` pasado del total va a la
// última página con datos (o a la 1 si no hay ninguna); si no, una menos.
export function previousQueuePage(page: number, totalPages: number): number {
  return page > totalPages ? Math.max(1, totalPages) : page - 1;
}

// Parámetros de la API (página base 0). Con "Todas" no se manda `status`.
export function queueApiParams({ status, page }: QueueState): {
  status?: TaxProfileStatus;
  page: number;
  size: number;
} {
  const params = { page: page - 1, size: QUEUE_PAGE_SIZE };
  return status === 'ALL' ? params : { status, ...params };
}

export function taxProfileReviewPath(commercialPublicId: string): string {
  return `${TAX_PROFILES_PATH}/${commercialPublicId}`;
}

export const CASE_TABS: readonly CaseTabKey[] = [
  'tax-profile',
  'documents',
  'commitment',
  'requests',
  'findings',
  'incidents',
];

export function parseCaseTab(value: string | string[] | undefined): CaseTabKey {
  const raw = first(value);
  return CASE_TABS.find((tab) => tab === raw) ?? 'tax-profile';
}

export function casePath(commercialPublicId: string, tab: CaseTabKey): string {
  const base = `${COMMERCIAL_CASE_PATH}/${commercialPublicId}`;
  return tab === 'tax-profile' ? base : `${base}?tab=${tab}`;
}

// Teclado de una lista de pestañas (patrón WAI-ARIA): `null` si la tecla no mueve nada.
export function nextTabIndex(current: number, key: string, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

// ---------- Spec 018: requerimientos, alertas, reglas y catálogo ----------
// En la URL solo viajan `status`, `page`, `tab` y `all` (RN-13): los constructores ignoran cualquier otra clave.

export const INFORMATION_REQUESTS_PATH = '/compliance/information-requests';
export const ALERTS_PATH = '/compliance/alerts';
export const ALERT_RULES_PATH = '/compliance/alert-rules';
export const TAX_CATALOG_PATH = '/compliance/tax-catalog';

export type RequestQueueStatus = InformationRequestStatus | 'ALL';
export interface RequestQueueState {
  status: RequestQueueStatus;
  page: number; // base 1 (en la URL)
}

export const REQUEST_QUEUE_STATUSES: readonly RequestQueueStatus[] = [
  'OPEN',
  'RESPONDED',
  'OBSERVED',
  'CLOSED_SATISFIED',
  'CLOSED_WITH_FINDING',
  'CANCELLED',
  'ALL',
];
const DEFAULT_REQUEST_STATUS: RequestQueueStatus = 'RESPONDED';

function parsePage(value: string | string[] | undefined): number {
  const raw = first(value);
  return raw !== undefined && /^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : 1;
}

export function parseRequestQueueParams(searchParams: RawParams): RequestQueueState {
  const rawStatus = first(searchParams.status);
  const status = REQUEST_QUEUE_STATUSES.find((s) => s === rawStatus) ?? DEFAULT_REQUEST_STATUS;
  return { status, page: parsePage(searchParams.page) };
}

export function requestQueuePath({ status, page }: RequestQueueState): string {
  const parts: string[] = [];
  if (status !== DEFAULT_REQUEST_STATUS) parts.push(`status=${status}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `${INFORMATION_REQUESTS_PATH}?${parts.join('&')}` : INFORMATION_REQUESTS_PATH;
}

// Parámetros de la API (página base 0). Con "Todos" no se manda `status`.
export function requestQueueApiParams({ status, page }: RequestQueueState): {
  status?: InformationRequestStatus;
  page: number;
  size: number;
} {
  const params = { page: page - 1, size: QUEUE_PAGE_SIZE };
  return status === 'ALL' ? params : { status, ...params };
}

export function requestDetailPath(requestPublicId: string): string {
  return `${INFORMATION_REQUESTS_PATH}/${requestPublicId}`;
}

export interface AlertsState {
  pendingOnly: boolean;
  page: number; // base 1 (en la URL)
}

export function parseAlertsParams(searchParams: RawParams): AlertsState {
  return { pendingOnly: first(searchParams.all) !== '1', page: parsePage(searchParams.page) };
}

export function alertsPath({ pendingOnly, page }: AlertsState): string {
  const parts: string[] = [];
  if (!pendingOnly) parts.push('all=1');
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `${ALERTS_PATH}?${parts.join('&')}` : ALERTS_PATH;
}

const DEFAULT_CATALOG_TAB: TaxCatalogType = 'REGIME';

export function parseCatalogTab(value: string | string[] | undefined): TaxCatalogType {
  const raw = first(value);
  return CATALOG_TYPES.find((t) => t === raw) ?? DEFAULT_CATALOG_TAB;
}

export function catalogPath(tab: TaxCatalogType): string {
  return tab === DEFAULT_CATALOG_TAB ? TAX_CATALOG_PATH : `${TAX_CATALOG_PATH}?tab=${tab}`;
}
