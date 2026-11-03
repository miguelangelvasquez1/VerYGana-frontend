import { describe, expect, it } from 'vitest';
import { EXPEDIENTE_INVALIDATIONS, expedienteKeys } from '@/hooks/commercial/expedienteKeys';
import {
  informationRequestInvalidations,
  informationRequestKeys,
} from '@/hooks/commercial/informationRequestKeys';
import { taxProfileKeys } from '@/hooks/commercial/taxProfileKeys';

const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((part, i) => key[i] === part);

describe('claves del expediente y de las solicitudes', () => {
  it('cada clave empieza por su raíz y son distintas entre sí', () => {
    expect(startsWith(expedienteKeys.list, expedienteKeys.all)).toBe(true);
    const detail = informationRequestKeys.detail('u1');
    expect(startsWith(detail, informationRequestKeys.all)).toBe(true);
    expect(detail).not.toEqual(informationRequestKeys.detail('u2'));
    expect(detail).not.toEqual(informationRequestKeys.list);
  });

  it('RN-17: confirmar una carga deja viejos el expediente y los documentos del onboarding', () => {
    expect(EXPEDIENTE_INVALIDATIONS.confirmUpload).toContainEqual(expedienteKeys.list);
    expect(EXPEDIENTE_INVALIDATIONS.confirmUpload).toContainEqual(taxProfileKeys.onboardingDocuments);
    expect(EXPEDIENTE_INVALIDATIONS.uploadRejected).toContainEqual(expedienteKeys.list);
  });

  it('CA-19: responder invalida la lista (de ahí sale la insignia) y el detalle', () => {
    for (const keys of [
      informationRequestInvalidations.respond('u1'),
      informationRequestInvalidations.respondRejected('u1'),
    ]) {
      expect(keys).toContainEqual(informationRequestKeys.list);
      expect(keys).toContainEqual(informationRequestKeys.detail('u1'));
    }
  });

  it('ninguna clave propia es la de otra entrega', () => {
    const own = [
      expedienteKeys.all,
      expedienteKeys.list,
      informationRequestKeys.all,
      informationRequestKeys.list,
      informationRequestKeys.detail('u1'),
    ];
    for (const key of own) {
      expect(key[0]).not.toBe('commercial-tax-profile');
      expect(key[0]).not.toBe('commercial-declarations');
    }
  });
});
