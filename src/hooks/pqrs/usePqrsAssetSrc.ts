import { useEffect, useState } from "react";
import { getAccessToken, onAccessTokenChange, whenTokenReady } from "@/lib/auth/tokenStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function buildSrc(viewUrl: string, token: string | null): string | undefined {
  if (!token) return undefined;
  return `${API_BASE_URL}${viewUrl}?token=${encodeURIComponent(token)}`;
}

/**
 * `viewUrl` de un asset de PQRS ya no es una URL firmada lista para usar
 * contra R2 — es una ruta propia de la API que el backend autentica por JWT.
 * Un <img>/<video> no puede mandar el header Authorization, así que el token
 * va como query param, igual que el resto de imágenes privadas del backend.
 */
export function usePqrsAssetSrc(viewUrl: string): string | undefined {
  const [src, setSrc] = useState<string | undefined>(() => buildSrc(viewUrl, getAccessToken()));

  useEffect(() => {
    let cancelled = false;

    whenTokenReady().then(() => {
      if (!cancelled) setSrc(buildSrc(viewUrl, getAccessToken()));
    });

    const unsubscribe = onAccessTokenChange((token) => {
      if (!cancelled) setSrc(buildSrc(viewUrl, token));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [viewUrl]);

  return src;
}
