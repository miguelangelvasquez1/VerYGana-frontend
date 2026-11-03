import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { readApiError, toFormFieldPath } from '@/lib/api/apiError';

function axiosError(status: number, data: unknown): AxiosError {
  const config = {
    headers: new AxiosHeaders({ Authorization: 'Bearer secreto-de-prueba' }),
  } as InternalAxiosRequestConfig;
  return new AxiosError('fallo', 'ERR_BAD_REQUEST', config, {}, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('toFormFieldPath', () => {
  it('convierte corchetes a puntos', () => {
    expect(toFormFieldPath('activities[0].ciiuCode')).toBe('activities.0.ciiuCode');
    expect(toFormFieldPath('incomeReports[10].periodEnd')).toBe('incomeReports.10.periodEnd');
  });
  it('renombra amountCents a amount', () => {
    expect(toFormFieldPath('incomeReports[1].amountCents')).toBe('incomeReports.1.amount');
  });
  it('deja igual un campo simple', () => {
    expect(toFormFieldPath('currentCapacity')).toBe('currentCapacity');
  });
});

describe('readApiError', () => {
  it('extrae status, message y details', () => {
    const result = readApiError(
      axiosError(400, { message: 'Dato inválido', details: { currentCapacity: 'Obligatorio' } }),
    );
    expect(result).toEqual({
      status: 400,
      message: 'Dato inválido',
      details: { currentCapacity: 'Obligatorio' },
    });
  });
  it('details que no es objeto se descarta', () => {
    const result = readApiError(axiosError(400, { message: 'x', details: 'texto' }));
    expect(result.message).toBe('x');
    expect(result).not.toHaveProperty('details');
    const arr = readApiError(axiosError(400, { message: 'x', details: ['a'] }));
    expect(arr).not.toHaveProperty('details');
  });
  it('details con valores que no son texto se descarta', () => {
    const result = readApiError(axiosError(400, { message: 'x', details: { a: 1 } }));
    expect(result).not.toHaveProperty('details');
  });
  it('Error normal o undefined devuelve objeto vacío', () => {
    expect(readApiError(new Error('boom'))).toEqual({});
    expect(readApiError(undefined)).toEqual({});
  });
  it('nunca incluye la configuración ni cabeceras', () => {
    const result = readApiError(axiosError(400, { message: 'x' }));
    expect(JSON.stringify(result)).not.toContain('Authorization');
    expect(JSON.stringify(result)).not.toContain('secreto-de-prueba');
  });
  it('respuesta sin cuerpo conocido conserva el status', () => {
    expect(readApiError(axiosError(503, '<html>'))).toEqual({ status: 503 });
  });
});
