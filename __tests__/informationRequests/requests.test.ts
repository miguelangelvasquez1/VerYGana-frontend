import { describe, expect, it } from 'vitest';
import {
  buildTimeline,
  canRespond,
  countAwaitingResponse,
  isUuid,
  latestInsufficientReview,
  needsToneBanner,
  splitRequestsByTab,
} from '@/lib/informationRequests/requests';
import { TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import type {
  InformationRequest,
  InformationRequestStatus,
  InformationRequestTrigger,
} from '@/types/compliance/InformationRequest.types';

function request(
  status: InformationRequestStatus,
  issuedAt: string,
  extra: Partial<InformationRequest> = {},
): InformationRequest {
  return {
    publicId: `${status}-${issuedAt}`,
    status,
    issuedAt,
    trigger: 'RISK',
    responses: [],
    reviews: [],
    ...extra,
  } as unknown as InformationRequest;
}

const STATUSES: InformationRequestStatus[] = [
  'OPEN',
  'RESPONDED',
  'OBSERVED',
  'CLOSED_SATISFIED',
  'CLOSED_WITH_FINDING',
  'CANCELLED',
];

describe('splitRequestsByTab (CA-8)', () => {
  it('pendientes: OPEN, OBSERVED y RESPONDED; historial: las cerradas y anuladas', () => {
    const list = STATUSES.map((s, i) => request(s, `2026-10-0${i + 1}T10:00:00-05:00`));
    const { pending, history } = splitRequestsByTab(list);
    expect(pending.map((r) => r.status).sort()).toEqual(['OBSERVED', 'OPEN', 'RESPONDED']);
    expect(history.map((r) => r.status).sort()).toEqual([
      'CANCELLED',
      'CLOSED_SATISFIED',
      'CLOSED_WITH_FINDING',
    ]);
  });

  it('cada pestaña por issuedAt descendente aunque la entrada venga desordenada', () => {
    const a = request('OPEN', '2026-10-01T10:00:00-05:00');
    const b = request('OBSERVED', '2026-10-03T10:00:00-05:00');
    const c = request('RESPONDED', '2026-10-02T10:00:00-05:00');
    const d = request('CANCELLED', '2026-09-01T10:00:00-05:00');
    const e = request('CLOSED_SATISFIED', '2026-09-05T10:00:00-05:00');
    const { pending, history } = splitRequestsByTab([a, d, c, e, b]);
    expect(pending).toEqual([b, c, a]);
    expect(history).toEqual([e, d]);
  });
});

describe('countAwaitingResponse (CA-18, CA-19)', () => {
  it('cuenta OPEN y OBSERVED; RESPONDED y cerradas no', () => {
    expect(countAwaitingResponse(STATUSES.map((s) => request(s, '2026-10-01T10:00:00Z')))).toBe(2);
    expect(countAwaitingResponse([])).toBe(0);
  });
});

describe('canRespond (CA-13)', () => {
  it('solo OPEN y OBSERVED', () => {
    expect(STATUSES.filter(canRespond)).toEqual(['OPEN', 'OBSERVED']);
  });
});

describe('needsToneBanner (CA-14)', () => {
  it('solo MISSING_MANIFESTATION, EXPRESS_REFUSAL e INCIDENT', () => {
    const triggers = Object.keys(TRIGGER_LABELS) as InformationRequestTrigger[];
    expect(triggers).toHaveLength(10);
    expect(triggers.filter(needsToneBanner).sort()).toEqual(
      ['EXPRESS_REFUSAL', 'INCIDENT', 'MISSING_MANIFESTATION'].sort(),
    );
  });
});

describe('buildTimeline (CA-9)', () => {
  it('respuestas y revisiones intercaladas en orden cronológico ascendente', () => {
    const view = request('OBSERVED', '2026-10-01T00:00:00Z', {
      responses: [
        { message: 'segunda', documentIds: [], receivedAt: '2026-10-05T10:00:00Z' },
        { message: 'primera', documentIds: [], receivedAt: '2026-10-02T10:00:00Z' },
      ],
      reviews: [{ result: 'INSUFFICIENT', notes: 'falta', reviewedAt: '2026-10-03T10:00:00Z' }],
    });
    const entries = buildTimeline(view);
    expect(entries.map((e) => e.kind)).toEqual(['response', 'review', 'response']);
    expect(entries.map((e) => e.at)).toEqual([
      '2026-10-02T10:00:00Z',
      '2026-10-03T10:00:00Z',
      '2026-10-05T10:00:00Z',
    ]);
  });

  it('con la misma fecha, la respuesta antes que la revisión', () => {
    const at = '2026-10-02T10:00:00Z';
    const view = request('OBSERVED', at, {
      responses: [{ message: 'x', documentIds: [], receivedAt: at }],
      reviews: [{ result: 'SUFFICIENT', notes: null, reviewedAt: at }],
    });
    expect(buildTimeline(view).map((e) => e.kind)).toEqual(['response', 'review']);
  });
});

describe('latestInsufficientReview', () => {
  it('la última INSUFFICIENT, ignorando SUFFICIENT; sin ninguna, null', () => {
    const view = request('OBSERVED', '2026-10-01T00:00:00Z', {
      reviews: [
        { result: 'INSUFFICIENT', notes: 'vieja', reviewedAt: '2026-10-02T00:00:00Z' },
        { result: 'INSUFFICIENT', notes: 'nueva', reviewedAt: '2026-10-04T00:00:00Z' },
        { result: 'SUFFICIENT', notes: null, reviewedAt: '2026-10-05T00:00:00Z' },
      ],
    });
    expect(latestInsufficientReview(view)?.notes).toBe('nueva');
    expect(latestInsufficientReview(request('OPEN', '2026-10-01T00:00:00Z'))).toBeNull();
  });
});

describe('isUuid (CA-17)', () => {
  it('acepta UUID en minúsculas y mayúsculas; rechaza el resto', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(isUuid(uuid)).toBe(true);
    expect(isUuid(uuid.toUpperCase())).toBe(true);
    expect(isUuid('abc')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(uuid.replace(/-/g, ''))).toBe(false);
    expect(isUuid(`${uuid}0`)).toBe(false);
  });
});
