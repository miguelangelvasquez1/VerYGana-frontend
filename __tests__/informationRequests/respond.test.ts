import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  addUploadedDocument,
  buildRespondBody,
  emptyRespondValues,
  respondErrorOutcome,
  respondSchema,
} from '@/lib/informationRequests/respond';

const EMPTY_MSG = 'Escribe una aclaración o adjunta al menos un documento';
const GENERIC = 'No pudimos enviar tu respuesta. Intenta de nuevo';

function axiosError(status: number, message?: string): AxiosError {
  return new AxiosError('fallo', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: message ? { message } : {},
  } as AxiosResponse);
}

const issues = (values: unknown) => {
  const result = respondSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join('.'), msg: i.message }));
};

describe('respondSchema (CA-11, RN-6)', () => {
  it('vacío o solo espacios, sin documentos: error en message', () => {
    expect(issues({ message: '', documents: [] })).toContainEqual({ path: 'message', msg: EMPTY_MSG });
    expect(issues({ message: '   ', documents: [] })).toContainEqual({ path: 'message', msg: EMPTY_MSG });
  });

  it('2000 caracteres pasa; 2001 no', () => {
    expect(issues({ message: 'a'.repeat(2000), documents: [] })).toEqual([]);
    expect(issues({ message: 'a'.repeat(2001), documents: [] })).toContainEqual({
      path: 'message',
      msg: 'Máximo 2000 caracteres',
    });
  });

  it('solo documentos y texto vacío: pasa', () => {
    expect(issues({ message: '', documents: [{ id: 3, name: 'a.pdf' }] })).toEqual([]);
  });
});

describe('buildRespondBody (CA-10)', () => {
  it('solo texto: sin documentIds, y recortado', () => {
    const body = buildRespondBody({ message: '  hola  ', documents: [] });
    expect(body).toEqual({ message: 'hola' });
    expect(body).not.toHaveProperty('documentIds');
  });

  it('solo documentos: sin message', () => {
    const body = buildRespondBody({
      message: '   ',
      documents: [
        { id: 3, name: 'a.pdf' },
        { id: 4, name: 'b.pdf' },
      ],
    });
    expect(body).toEqual({ documentIds: [3, 4] });
    expect(body).not.toHaveProperty('message');
  });

  it('ambos, y los ids repetidos van una vez', () => {
    expect(
      buildRespondBody({
        message: 'x',
        documents: [
          { id: 3, name: 'a.pdf' },
          { id: 3, name: 'a.pdf' },
        ],
      }),
    ).toEqual({ message: 'x', documentIds: [3] });
  });
});

describe('respondErrorOutcome (CA-15)', () => {
  it('400 con message: ese texto y vuelve a pedir', () => {
    const text = 'Este requerimiento no está esperando una respuesta suya.';
    expect(respondErrorOutcome(axiosError(400, text))).toEqual({ message: text, refetch: true });
  });

  it('500, red y 400 sin message: el genérico, sin volver a pedir', () => {
    expect(respondErrorOutcome(axiosError(500, 'x'))).toEqual({ message: GENERIC, refetch: false });
    expect(respondErrorOutcome(new Error('red'))).toEqual({ message: GENERIC, refetch: false });
    expect(respondErrorOutcome(axiosError(400))).toEqual({ message: GENERIC, refetch: false });
  });
});

describe('emptyRespondValues', () => {
  it('valores vacíos, siempre un objeto nuevo', () => {
    expect(emptyRespondValues()).toEqual({ message: '', documents: [] });
    expect(emptyRespondValues()).not.toBe(emptyRespondValues());
    expect(emptyRespondValues().documents).not.toBe(emptyRespondValues().documents);
  });
});

describe('addUploadedDocument (RN-8, CA-12)', () => {
  const a = { id: 1, name: 'a.pdf' };
  const b = { id: 2, name: 'b.pdf' };
  const c = { id: 3, name: 'c.pdf' };

  it('agrega el documento nuevo al final', () => {
    expect(addUploadedDocument([a], c, null)).toEqual([a, c]);
  });

  it('volver a cargar el mismo tipo quita el documento que reemplaza (ya no vigente)', () => {
    expect(addUploadedDocument([a, b], c, 2)).toEqual([a, c]);
  });

  it('dos ítems DOCUMENT del mismo tipo: el segundo reemplaza al primero de la lista', () => {
    const afterFirst = addUploadedDocument([], a, 10);
    expect(addUploadedDocument(afterFirst, b, a.id)).toEqual([b]);
  });

  it('no duplica un documento que ya está', () => {
    expect(addUploadedDocument([a], a, null)).toEqual([a]);
  });
});

describe('respondErrorOutcome conserva el aviso (bloqueante 7)', () => {
  it('un 400 con message pide releer y trae el texto de la API', () => {
    expect(respondErrorOutcome(axiosError(400, 'Ya no espera respuesta'))).toEqual({
      message: 'Ya no espera respuesta',
      refetch: true,
    });
  });
});
