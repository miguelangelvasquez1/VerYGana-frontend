import { describe, expect, it } from 'vitest';
import {
  CASE_TABS,
  casePath,
  nextTabIndex,
  previousQueuePage,
  parseCaseTab,
  parseQueueParams,
  queueApiParams,
  queuePath,
  taxProfileReviewPath,
  type QueueState,
} from '@/lib/compliance/routes';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('parseQueueParams', () => {
  it('por defecto: enviadas, página 1 (CA-1)', () => {
    expect(parseQueueParams({})).toEqual({ status: 'SUBMITTED', page: 1 });
  });

  it('lee estado y página', () => {
    expect(parseQueueParams({ status: 'OBSERVED', page: '2' })).toEqual({ status: 'OBSERVED', page: 2 });
    expect(parseQueueParams({ status: 'ALL' })).toEqual({ status: 'ALL', page: 1 });
  });

  it('un estado desconocido o en minúsculas vuelve al por defecto', () => {
    for (const status of ['observed', 'X', '']) {
      expect(parseQueueParams({ status }).status).toBe('SUBMITTED');
    }
  });

  it('una página inválida vuelve a 1', () => {
    for (const page of ['0', '-3', '1.5', 'abc', '2abc', '']) {
      expect(parseQueueParams({ page }).page).toBe(1);
    }
  });

  it('con arreglos toma el primero', () => {
    expect(parseQueueParams({ status: ['REVIEWED', 'OBSERVED'], page: ['3', '4'] })).toEqual({
      status: 'REVIEWED',
      page: 3,
    });
  });
});

describe('queuePath', () => {
  it('valores por defecto sin query', () => {
    expect(queuePath({ status: 'SUBMITTED', page: 1 })).toBe('/compliance/tax-profiles');
  });

  it('estado y página en ese orden', () => {
    expect(queuePath({ status: 'OBSERVED', page: 1 })).toBe('/compliance/tax-profiles?status=OBSERVED');
    expect(queuePath({ status: 'OBSERVED', page: 2 })).toBe('/compliance/tax-profiles?status=OBSERVED&page=2');
    expect(queuePath({ status: 'SUBMITTED', page: 3 })).toBe('/compliance/tax-profiles?page=3');
    expect(queuePath({ status: 'ALL', page: 1 })).toBe('/compliance/tax-profiles?status=ALL');
  });

  it('ida y vuelta (CA-2)', () => {
    for (const status of ['SUBMITTED', 'OBSERVED', 'REVIEWED', 'ALL'] as const) {
      for (const page of [1, 2, 3]) {
        const state: QueueState = { status, page };
        const path = queuePath(state);
        const query = path.includes('?') ? path.slice(path.indexOf('?') + 1) : '';
        const sp: Record<string, string> = {};
        for (const pair of query.split('&').filter(Boolean)) {
          const [k, v] = pair.split('=');
          sp[k] = v;
        }
        expect(parseQueueParams(sp)).toEqual(state);
      }
    }
  });

  it('solo lleva status, page o tab (RN-9)', () => {
    const paths = [
      queuePath({ status: 'ALL', page: 4 }),
      casePath(UUID, 'documents'),
      casePath(UUID, 'tax-profile'),
    ];
    for (const path of paths) {
      const query = path.includes('?') ? path.slice(path.indexOf('?') + 1) : '';
      for (const pair of query.split('&').filter(Boolean)) {
        expect(['status', 'page', 'tab']).toContain(pair.split('=')[0]);
      }
    }
  });
});

describe('queueApiParams', () => {
  it('con ALL no manda status y la página pasa a base 0', () => {
    const params = queueApiParams({ status: 'ALL', page: 1 });
    expect(params).toEqual({ page: 0, size: 20 });
    expect(params).not.toHaveProperty('status');
  });

  it('con un estado lo manda', () => {
    expect(queueApiParams({ status: 'REVIEWED', page: 3 })).toEqual({
      status: 'REVIEWED',
      page: 2,
      size: 20,
    });
  });
});

describe('rutas de revisión y caso', () => {
  it('taxProfileReviewPath y casePath', () => {
    expect(taxProfileReviewPath(UUID)).toBe(`/compliance/tax-profiles/${UUID}`);
    expect(casePath(UUID, 'tax-profile')).toBe(`/compliance/commercials/${UUID}`);
    expect(casePath(UUID, 'documents')).toBe(`/compliance/commercials/${UUID}?tab=documents`);
  });
});

describe('parseCaseTab', () => {
  it('acepta las seis pestañas', () => {
    expect(CASE_TABS).toHaveLength(6);
    for (const tab of CASE_TABS) expect(parseCaseTab(tab)).toBe(tab);
  });

  it('cualquier otro valor abre la ficha tributaria (CA-19)', () => {
    for (const value of [undefined, '', 'Documents', 'otra', []]) {
      expect(parseCaseTab(value)).toBe('tax-profile');
    }
  });

  it('con un arreglo toma el primero', () => {
    expect(parseCaseTab(['incidents', 'documents'])).toBe('incidents');
  });
});

describe('previousQueuePage (S10)', () => {
  it('con una página dentro del rango vuelve una página', () => {
    expect(previousQueuePage(3, 5)).toBe(2);
    expect(previousQueuePage(2, 2)).toBe(1);
  });

  it('con ?page= mayor que el total va a la última página con datos', () => {
    expect(previousQueuePage(9, 3)).toBe(3);
    expect(previousQueuePage(500, 1)).toBe(1);
  });

  it('sin páginas (total 0) va a la 1', () => {
    expect(previousQueuePage(4, 0)).toBe(1);
  });
});

describe('nextTabIndex', () => {
  it('flechas con vuelta, Inicio y Fin', () => {
    expect(nextTabIndex(0, 'ArrowRight', 6)).toBe(1);
    expect(nextTabIndex(5, 'ArrowRight', 6)).toBe(0);
    expect(nextTabIndex(0, 'ArrowLeft', 6)).toBe(5);
    expect(nextTabIndex(3, 'ArrowLeft', 6)).toBe(2);
    expect(nextTabIndex(3, 'Home', 6)).toBe(0);
    expect(nextTabIndex(3, 'End', 6)).toBe(5);
  });

  it('otra tecla no mueve nada', () => {
    expect(nextTabIndex(0, 'Enter', 6)).toBeNull();
  });
});
