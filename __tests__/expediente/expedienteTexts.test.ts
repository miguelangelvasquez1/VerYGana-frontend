import { describe, expect, it } from 'vitest';
import {
  EXPEDIENTE_TEXTS as E,
  INFORMATION_REQUEST_TEXTS as R,
} from '@/lib/labels/expedienteRequests';

// Todos los textos como cadenas; las funciones se llaman con argumentos ficticios.
function allStrings(): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  const walk = (prefix: string, group: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(group)) {
      const key = `${prefix}.${name}`;
      if (typeof value === 'string') out.push({ key, text: value });
      else if (typeof value === 'function') {
        const fn = value as (...args: unknown[]) => string;
        out.push({ key, text: fn('X', 'Y') });
        out.push({ key: `${key}(2)`, text: fn(2, 'Y') });
      }
    }
  };
  walk('E', E);
  walk('R', R);
  return out;
}

describe('textos de la entrega: literales de la spec', () => {
  it('estados del expediente', () => {
    expect(E.empty).toBe('Aún no tienes documentos en tu expediente.');
    expect(E.loadError).toBe('No pudimos cargar tu expediente.');
    expect(E.forbidden).toBe('No tienes permiso para ver este expediente.');
    expect(E.uploaded).toBe('Documento cargado');
    expect(E.uploadFailed).toBe('No pudimos subir el documento. Intenta de nuevo');
    expect(E.replaceNotice).toBe('El documento anterior quedará en tu historial');
  });

  it('lista de solicitudes', () => {
    expect(R.emptyPending).toBe('No tienes solicitudes pendientes.');
    expect(R.emptyHistory).toBe('Aún no tienes solicitudes cerradas.');
    expect(R.listError).toBe('No pudimos cargar tus solicitudes.');
    expect(R.listForbidden).toBe('No tienes permiso para ver estas solicitudes.');
  });

  it('detalle de la solicitud', () => {
    expect(R.notFound).toBe('No encontramos esta solicitud.');
    expect(R.backToList).toBe('Volver a mis solicitudes');
    expect(R.detailError).toBe('No pudimos cargar la solicitud.');
    expect(R.detailForbidden).toBe('No tienes permiso para ver esta solicitud.');
    expect(R.inReview).toBe('Tu respuesta está en revisión por VERYGANA.');
    expect(R.respondFailed).toBe('No pudimos enviar tu respuesta. Intenta de nuevo');
  });

  it('reglas RN-3, RN-6, RN-7, RN-9, RN-10 y linkedDocumentId', () => {
    expect(E.formatNotAllowed).toBe('Formato no permitido. Usa PDF, JPG o PNG');
    expect(E.fileTooLarge).toBe('El archivo supera el tamaño máximo de 10MB');
    expect(R.emptyResponse).toBe('Escribe una aclaración o adjunta al menos un documento');
    expect(R.responseReceived).toBe(
      'Recibimos tu respuesta. VERYGANA la revisará; la solicitud se cierra cuando termine la revisión',
    );
    expect(R.uploadAfterRegistration).toBe(
      'Podrás cargar este documento cuando termines tu registro. Mientras tanto, puedes responder con una aclaración.',
    );
    expect(R.toneBanner).toBe(
      'Esta solicitud es una aclaración sobre el compromiso de formalización. No es una sanción.',
    );
    expect(R.linkedDocument).toBe(
      'Ya tenemos un documento de este tipo en tu expediente; VERYGANA revisará si es suficiente',
    );
  });

  it('RN-15: selector de soporte', () => {
    expect(E.supportNone).toBe('Sin soporte');
    expect(E.supportStale).toBe('Documento ya no vigente');
    expect(E.supportLoading).toBe('Cargando documentos…');
    expect(E.supportLoadError).toBe('No pudimos cargar tus documentos');
    expect(E.supportSaved).toBe('Documento guardado');
    expect(E.supportNotVigent).toBe('Este documento ya no está vigente. Elige otro o «Sin soporte»');
  });
});

describe('textos de la entrega: funciones', () => {
  it('fechas y etiquetas con argumento', () => {
    expect(R.expectedResponse('X')).toBe('Respuesta esperada: X');
    expect(R.dueBefore('5 de noviembre de 2026')).toBe('Responder antes del 5 de noviembre de 2026');
    expect(R.sentOn('5 de noviembre de 2026')).toBe('Enviada el 5 de noviembre de 2026');
    expect(E.uploadedOn('5 de noviembre de 2026')).toBe('Cargado el 5 de noviembre de 2026');
    expect(E.expiresOn('5 de noviembre de 2026')).toBe('Vence el 5 de noviembre de 2026');
    expect(E.supersededOn('5 de noviembre de 2026')).toBe('Reemplazado el 5 de noviembre de 2026');
    expect(R.closedOn('5 de noviembre de 2026')).toBe('Cerrada el 5 de noviembre de 2026');
    expect(R.messageCounter(12)).toBe('12/2000');
    expect(E.supportOptionLabel('RUT', 'rut.pdf')).toBe('RUT — rut.pdf');
  });

  it('CA-18: aviso del onboarding en singular y plural', () => {
    expect(R.requestsNotice(1)).toBe('VERYGANA te envió 1 solicitud de información');
    expect(R.requestsNotice(2)).toBe('VERYGANA te envió 2 solicitudes de información');
  });
});

describe('tono de los textos', () => {
  it('RN-10: "sanción" solo aparece como "No es una sanción"', () => {
    for (const { key, text } of allStrings()) {
      const withoutAllowed = text.replace(/No es una sanción/gi, '');
      expect(withoutAllowed, key).not.toMatch(/sanci[oó]n/i);
    }
  });

  it('RN-7: ningún texto dice que responder resuelve o cierra, salvo "Cerrada el"', () => {
    for (const { key, text } of allStrings()) {
      if (key.startsWith('R.closedOn')) continue;
      expect(text, key).not.toMatch(/resuelt|cerrad[ao]\b/i);
    }
  });
});
