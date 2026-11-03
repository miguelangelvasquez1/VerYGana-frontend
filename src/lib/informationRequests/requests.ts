import type {
  InformationRequest,
  InformationRequestStatus,
  InformationRequestTrigger,
  RequestResponse,
  RequestReview,
} from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

// Estados en los que el empresario tiene que responder (RN-6, RN-11).
export const AWAITING_RESPONSE_STATUSES: readonly InformationRequestStatus[] = ['OPEN', 'OBSERVED'];
export const PENDING_TAB_STATUSES: readonly InformationRequestStatus[] = [
  'OPEN',
  'OBSERVED',
  'RESPONDED',
];
export const HISTORY_TAB_STATUSES: readonly InformationRequestStatus[] = [
  'CLOSED_SATISFIED',
  'CLOSED_WITH_FINDING',
  'CANCELLED',
];

const TONE_BANNER_TRIGGERS: readonly InformationRequestTrigger[] = [
  'MISSING_MANIFESTATION',
  'EXPRESS_REFUSAL',
  'INCIDENT',
];

const time = (iso: string): number => {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const newestFirst = (a: InformationRequest, b: InformationRequest) =>
  time(b.issuedAt) - time(a.issuedAt);

// CA-8: no se confía en el orden de la API.
export function splitRequestsByTab(list: readonly InformationRequest[]): {
  pending: InformationRequest[];
  history: InformationRequest[];
} {
  return {
    pending: list.filter((r) => PENDING_TAB_STATUSES.includes(r.status)).sort(newestFirst),
    history: list.filter((r) => HISTORY_TAB_STATUSES.includes(r.status)).sort(newestFirst),
  };
}

export function countAwaitingResponse(list: readonly InformationRequest[]): number {
  return list.filter((r) => AWAITING_RESPONSE_STATUSES.includes(r.status)).length;
}

export function canRespond(status: InformationRequestStatus): boolean {
  return AWAITING_RESPONSE_STATUSES.includes(status);
}

export function needsToneBanner(trigger: InformationRequestTrigger): boolean {
  return TONE_BANNER_TRIGGERS.includes(trigger);
}

export type TimelineEntry =
  | { kind: 'response'; at: string; response: RequestResponse }
  | { kind: 'review'; at: string; review: RequestReview };

// Respuestas y revisiones por fecha ascendente; con la misma fecha, la respuesta primero.
export function buildTimeline(request: InformationRequest): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...request.responses.map<TimelineEntry>((response) => ({
      kind: 'response',
      at: response.receivedAt,
      response,
    })),
    ...request.reviews.map<TimelineEntry>((review) => ({
      kind: 'review',
      at: review.reviewedAt,
      review,
    })),
  ];
  return entries.sort((a, b) => {
    const byTime = time(a.at) - time(b.at);
    if (byTime !== 0) return byTime;
    return a.kind === b.kind ? 0 : a.kind === 'response' ? -1 : 1;
  });
}

export function latestInsufficientReview(request: InformationRequest): RequestReview | null {
  const insufficient = request.reviews.filter((r) => r.result === 'INSUFFICIENT');
  if (insufficient.length === 0) return null;
  return insufficient.reduce((latest, r) => (time(r.reviewedAt) >= time(latest.reviewedAt) ? r : latest));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Un valor que no es UUID da 500 en la API (C-2): no se le pide el detalle.
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
