import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { actionErrorMessage, requestDetailLoadView } from '@/lib/compliance/loadErrors';

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
  const response = status === null ? undefined : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('Request failed', status === null ? 'ERR_NETWORK' : 'ERR_BAD_REQUEST', config, {}, response);
}

describe('requestDetailLoadView', () => {
  it('404 y 400: not-found; 403: forbidden; el resto: error (CA-6)', () => {
    expect(requestDetailLoadView(axiosError(404))).toBe('not-found');
    expect(requestDetailLoadView(axiosError(400))).toBe('not-found');
    expect(requestDetailLoadView(axiosError(403))).toBe('forbidden');
    expect(requestDetailLoadView(axiosError(500))).toBe('error');
    expect(requestDetailLoadView(axiosError(null))).toBe('error');
    expect(requestDetailLoadView(new Error('x'))).toBe('error');
  });
});

describe('actionErrorMessage', () => {
  it('400 con message: tal cual', () => {
    expect(actionErrorMessage(axiosError(400, { message: 'La alerta ya fue revisada.' }))).toBe(
      'La alerta ya fue revisada.',
    );
  });
  it('400 sin message, 500 y red: error genérico', () => {
    const generic = 'No pudimos guardar. Intenta de nuevo.';
    expect(actionErrorMessage(axiosError(400, {}))).toBe(generic);
    expect(actionErrorMessage(axiosError(500, { message: 'boom' }))).toBe(generic);
    expect(actionErrorMessage(axiosError(null))).toBe(generic);
    expect(actionErrorMessage(new Error('x'))).toBe(generic);
  });
  it('403: sin permiso', () => {
    expect(actionErrorMessage(axiosError(403))).toBe('No tienes permiso para ver esta sección.');
  });
});
