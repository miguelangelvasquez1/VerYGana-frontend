import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { reviewLoadView, tabErrorView } from '@/lib/compliance/loadErrors';

const UUID = '11111111-1111-4111-8111-111111111111';

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
  const response = status === null ? undefined : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('Request failed', status === null ? 'ERR_NETWORK' : 'ERR_BAD_REQUEST', config, {}, response);
}

const apiNotFound = { message: `User with public id: ${UUID} not found` };

describe('reviewLoadView', () => {
  it('404: not-sent (CA-12); 403: forbidden; lo demás: error', () => {
    expect(reviewLoadView(axiosError(404, apiNotFound))).toBe('not-sent');
    expect(reviewLoadView(axiosError(403))).toBe('forbidden');
    expect(reviewLoadView(axiosError(500))).toBe('error');
    expect(reviewLoadView(axiosError(null))).toBe('error');
    expect(reviewLoadView(new Error('boom'))).toBe('error');
  });
});

describe('tabErrorView', () => {
  it('ficha tributaria con 404: todavía no la ha enviado, sin reintento (CA-20)', () => {
    expect(tabErrorView(axiosError(404, apiNotFound), 'tax-profile')).toEqual({
      message: 'El empresario todavía no ha enviado la ficha tributaria.',
      retry: false,
    });
  });

  it('las demás pestañas: 404 y 400 son empresario inexistente, sin reintento (D-4)', () => {
    for (const tab of ['documents', 'commitment', 'requests', 'findings', 'incidents'] as const) {
      for (const status of [404, 400]) {
        expect(tabErrorView(axiosError(status, apiNotFound), tab)).toEqual({
          message: 'No encontramos este empresario.',
          retry: false,
        });
      }
    }
  });

  it('403: sin permiso y sin reintento', () => {
    for (const tab of ['tax-profile', 'documents', 'incidents'] as const) {
      expect(tabErrorView(axiosError(403), tab)).toEqual({
        message: 'No tienes permiso para ver esta sección.',
        retry: false,
      });
    }
  });

  it('500 y red: no pudimos cargar la pestaña, con reintento (CA-23)', () => {
    expect(tabErrorView(axiosError(500), 'documents')).toEqual({
      message: 'No pudimos cargar los documentos.',
      retry: true,
    });
    expect(tabErrorView(axiosError(null), 'findings')).toEqual({
      message: 'No pudimos cargar los hallazgos.',
      retry: true,
    });
    expect(tabErrorView(new Error('boom'), 'tax-profile')).toEqual({
      message: 'No pudimos cargar la ficha tributaria.',
      retry: true,
    });
  });

  it('nunca devuelve el mensaje en inglés de la API ni el UUID', () => {
    for (const tab of ['tax-profile', 'documents', 'commitment', 'requests', 'findings', 'incidents'] as const) {
      for (const status of [400, 403, 404, 500]) {
        const { message } = tabErrorView(axiosError(status, apiNotFound), tab);
        expect(message).not.toContain(UUID);
        expect(message).not.toContain('User with public id');
      }
    }
  });
});
