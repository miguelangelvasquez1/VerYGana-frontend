import { useEffect, useState } from "react";
import { getAccessToken, onAccessTokenChange, whenTokenReady } from "@/lib/auth/tokenStore";

function buildSrc(url: string, token: string | null): string | undefined {
  if (!token) return undefined;
  return `${url}?token=${encodeURIComponent(token)}`;
}

/**
 * Para rutas propias de la API que sirven un archivo privado (no una URL
 * firmada lista para usar contra R2/CDN) — el backend las autentica por JWT.
 * Un <img>/<a>/<video> no puede mandar el header Authorization, así que el
 * token va como query param. Reactivo al token: se recalcula en login/logout/
 * refresh vía el token store que sincroniza <AuthProvider>.
 */
export function useAuthenticatedAssetSrc(url: string): string | undefined {
  const [src, setSrc] = useState<string | undefined>(() => buildSrc(url, getAccessToken()));

  useEffect(() => {
    let cancelled = false;

    whenTokenReady().then(() => {
      if (!cancelled) setSrc(buildSrc(url, getAccessToken()));
    });

    const unsubscribe = onAccessTokenChange((token) => {
      if (!cancelled) setSrc(buildSrc(url, token));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [url]);

  return src;
}
