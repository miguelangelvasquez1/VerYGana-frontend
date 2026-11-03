import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  buildSectionReviewBody,
  createSectionReviewSchema,
  reviewErrorMessage,
} from '@/lib/compliance/sectionReview';

const GENERIC = 'No pudimos guardar la revisión. Intenta de nuevo.';

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: { Authorization: 'Bearer token-ficticio' } } as unknown as InternalAxiosRequestConfig;
  const response =
    status === null
      ? undefined
      : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('Request failed', status === null ? 'ERR_NETWORK' : 'ERR_BAD_REQUEST', config, {}, response);
}

describe('createSectionReviewSchema', () => {
  it('OBSERVED exige la nota (CA-8)', () => {
    const schema = createSectionReviewSchema('OBSERVED');
    for (const notes of ['', '   ']) {
      const result = schema.safeParse({ notes });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['notes']);
        expect(result.error.issues[0].message).toBe('Escribe la observación para el empresario.');
      }
    }
    expect(schema.safeParse({ notes: ' Falta el RUT ' }).success).toBe(true);
  });

  it('VERIFIED y NOT_APPLICABLE aceptan la nota vacía', () => {
    expect(createSectionReviewSchema('VERIFIED').safeParse({ notes: '' }).success).toBe(true);
    expect(createSectionReviewSchema('NOT_APPLICABLE').safeParse({ notes: '' }).success).toBe(true);
  });

  it('máximo 1000 caracteres tras recortar', () => {
    const schema = createSectionReviewSchema('OBSERVED');
    expect(schema.safeParse({ notes: 'a'.repeat(1000) }).success).toBe(true);
    expect(schema.safeParse({ notes: `  ${'a'.repeat(1000)}  ` }).success).toBe(true);
    const tooLong = schema.safeParse({ notes: 'a'.repeat(1001) });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) expect(tooLong.error.issues[0].message).toBe('Máximo 1000 caracteres');
  });
});

describe('buildSectionReviewBody', () => {
  it('sin nota: solo result, sin la clave notes (CA-9)', () => {
    const body = buildSectionReviewBody('VERIFIED', { notes: '  ' });
    expect(body).toEqual({ result: 'VERIFIED' });
    expect(Object.keys(body)).toEqual(['result']);
  });

  it('con nota: recortada (CA-8)', () => {
    expect(buildSectionReviewBody('OBSERVED', { notes: ' x ' })).toEqual({ result: 'OBSERVED', notes: 'x' });
  });
});

describe('reviewErrorMessage', () => {
  it('400 con message: ese texto tal cual (CA-10)', () => {
    expect(reviewErrorMessage(axiosError(400, { message: 'Indique la observación para que el empresario pueda aclararla.' }))).toBe(
      'Indique la observación para que el empresario pueda aclararla.',
    );
  });

  it('todo lo demás: el texto genérico', () => {
    expect(reviewErrorMessage(axiosError(400, {}))).toBe(GENERIC);
    expect(reviewErrorMessage(axiosError(500, { message: 'Unexpected error' }))).toBe(GENERIC);
    expect(reviewErrorMessage(axiosError(null))).toBe(GENERIC);
    expect(reviewErrorMessage(new Error('boom'))).toBe(GENERIC);
  });

  it('nunca arrastra la configuración ni la cabecera de autorización', () => {
    for (const err of [axiosError(400, { message: 'x' }), axiosError(500), axiosError(null)]) {
      const text = reviewErrorMessage(err);
      expect(text).not.toContain('Authorization');
      expect(text).not.toContain('token-ficticio');
    }
  });
});
