import { describe, expect, it } from 'vitest';
import {
  commercialNotificationHref,
  INFORMATION_REQUEST_NOTIFICATION_TITLES,
  INFORMATION_REQUESTS_PATH,
} from '@/lib/notifications/informationRequestNotifications';

describe('notificaciones de solicitudes de información (CA-20, RN-14)', () => {
  it('los títulos y la ruta son exactamente los acordados', () => {
    expect([...INFORMATION_REQUEST_NOTIFICATION_TITLES]).toEqual([
      'Solicitud de información de VERYGANA',
      'Tu respuesta tiene observaciones',
    ]);
    expect(INFORMATION_REQUESTS_PATH).toBe('/commercial/profile/information-requests');
  });

  it('cada título lleva a la lista', () => {
    for (const title of INFORMATION_REQUEST_NOTIFICATION_TITLES) {
      expect(commercialNotificationHref({ title })).toBe(INFORMATION_REQUESTS_PATH);
    }
  });

  it('la comparación es exacta: mayúsculas, espacios y puntos cambian el resultado', () => {
    expect(commercialNotificationHref({ title: 'solicitud de información de VERYGANA' })).toBeNull();
    expect(commercialNotificationHref({ title: ' Tu respuesta tiene observaciones' })).toBeNull();
    expect(commercialNotificationHref({ title: 'Tu respuesta tiene observaciones.' })).toBeNull();
    expect(commercialNotificationHref({ title: 'Compra aprobada' })).toBeNull();
  });
});
