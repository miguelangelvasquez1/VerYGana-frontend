import { describe, expect, it } from 'vitest';
import {
  ALERTS_PATH,
  ALERT_RULES_PATH,
  INFORMATION_REQUESTS_PATH,
  TAX_CATALOG_PATH,
  alertsPath,
  catalogPath,
  parseAlertsParams,
  parseCatalogTab,
  parseRequestQueueParams,
  requestDetailPath,
  requestQueueApiParams,
  requestQueuePath,
} from '@/lib/compliance/routes';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('cola de requerimientos', () => {
  it('por defecto: por revisar, página 1 (CA-2)', () => {
    expect(parseRequestQueueParams({})).toEqual({ status: 'RESPONDED', page: 1 });
  });

  it('status inválido cae al defecto; ALL y los seis estados se conservan', () => {
    expect(parseRequestQueueParams({ status: 'basura' }).status).toBe('RESPONDED');
    expect(parseRequestQueueParams({ status: ['OPEN', 'x'] }).status).toBe('OPEN');
    for (const s of ['OPEN', 'RESPONDED', 'OBSERVED', 'CLOSED_SATISFIED', 'CLOSED_WITH_FINDING', 'CANCELLED', 'ALL']) {
      expect(parseRequestQueueParams({ status: s }).status).toBe(s);
    }
  });

  it('página inválida es 1', () => {
    expect(parseRequestQueueParams({ page: '0' }).page).toBe(1);
    expect(parseRequestQueueParams({ page: '-2' }).page).toBe(1);
    expect(parseRequestQueueParams({ page: 'a' }).page).toBe(1);
    expect(parseRequestQueueParams({ page: '3' }).page).toBe(3);
  });

  it('ALL no manda status a la API y la página es base 0', () => {
    expect(requestQueueApiParams({ status: 'ALL', page: 2 })).toEqual({ page: 1, size: 20 });
    expect(requestQueueApiParams({ status: 'OPEN', page: 1 })).toEqual({ status: 'OPEN', page: 0, size: 20 });
  });

  it('la URL omite los valores por defecto', () => {
    expect(requestQueuePath({ status: 'RESPONDED', page: 1 })).toBe(INFORMATION_REQUESTS_PATH);
    expect(requestQueuePath({ status: 'ALL', page: 1 })).toBe(`${INFORMATION_REQUESTS_PATH}?status=ALL`);
    expect(requestQueuePath({ status: 'OPEN', page: 3 })).toBe(`${INFORMATION_REQUESTS_PATH}?status=OPEN&page=3`);
    expect(requestQueuePath({ status: 'RESPONDED', page: 2 })).toBe(`${INFORMATION_REQUESTS_PATH}?page=2`);
  });

  it('detalle', () => {
    expect(requestDetailPath(UUID)).toBe(`/compliance/information-requests/${UUID}`);
  });
});

describe('alertas', () => {
  it('sin all: solo pendientes; all=1: todas', () => {
    expect(parseAlertsParams({})).toEqual({ pendingOnly: true, page: 1 });
    expect(parseAlertsParams({ all: '1' })).toEqual({ pendingOnly: false, page: 1 });
    expect(parseAlertsParams({ all: '0' }).pendingOnly).toBe(true);
    expect(parseAlertsParams({ page: '4' }).page).toBe(4);
  });

  it('la URL', () => {
    expect(alertsPath({ pendingOnly: true, page: 1 })).toBe(ALERTS_PATH);
    expect(alertsPath({ pendingOnly: false, page: 1 })).toBe(`${ALERTS_PATH}?all=1`);
    expect(alertsPath({ pendingOnly: false, page: 2 })).toBe(`${ALERTS_PATH}?all=1&page=2`);
  });
});

describe('catálogo y reglas', () => {
  it('tab inválido es REGIME', () => {
    expect(parseCatalogTab(undefined)).toBe('REGIME');
    expect(parseCatalogTab('otro')).toBe('REGIME');
    expect(parseCatalogTab('VAT_CONDITION')).toBe('VAT_CONDITION');
    expect(parseCatalogTab(['INC_CONDITION'])).toBe('INC_CONDITION');
  });

  it('la URL', () => {
    expect(catalogPath('REGIME')).toBe(TAX_CATALOG_PATH);
    expect(catalogPath('INC_CONDITION')).toBe(`${TAX_CATALOG_PATH}?tab=INC_CONDITION`);
    expect(ALERT_RULES_PATH).toBe('/compliance/alert-rules');
  });
});

describe('solo status, page, tab y all viajan en la URL (CA-27)', () => {
  it('ignoran claves de más', () => {
    const extra = { status: 'OPEN', page: 2, email: 'a@b.co', all: '1', tab: 'REGIME' };
    const path = requestQueuePath(extra as never);
    expect(path).not.toMatch(/email|a@b/);
    expect(alertsPath({ pendingOnly: false, page: 1, email: 'a@b.co' } as never)).toBe(`${ALERTS_PATH}?all=1`);
    expect(catalogPath('REGIME', ) ).not.toMatch(/\?/);
  });
});
