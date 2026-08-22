import { useAuthenticatedAssetSrc } from "@/hooks/useAuthenticatedAssetSrc";

/**
 * `viewUrl` de un asset de PQRS no es una URL firmada lista para usar
 * contra R2 — es una ruta propia de la API que el backend autentica por JWT.
 * Alias de {@link useAuthenticatedAssetSrc} para los adjuntos de PQRS.
 */
export function usePqrsAssetSrc(viewUrl: string): string | undefined {
  return useAuthenticatedAssetSrc(viewUrl);
}
