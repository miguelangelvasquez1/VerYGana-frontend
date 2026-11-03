// Sin 'use client' para poder importarse desde las pruebas de Vitest.
export const informationRequestKeys = {
  all: ['commercial-information-requests'] as const,
  list: ['commercial-information-requests', 'list'] as const,
  detail: (publicId: string) =>
    ['commercial-information-requests', 'detail', publicId] as const,
};

// Qué claves deja desactualizadas responder (RN-17). Con la lista bajan las insignias (CA-19).
export const informationRequestInvalidations = {
  respond: (publicId: string) =>
    [informationRequestKeys.list, informationRequestKeys.detail(publicId)] as const,
  // D-3: ante un 400 se vuelven a pedir el detalle y la lista.
  respondRejected: (publicId: string) =>
    [informationRequestKeys.detail(publicId), informationRequestKeys.list] as const,
};
