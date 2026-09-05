'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adService } from '@/services/adService';
import { AdForConsumerDTO, AdLikedResponse } from '@/types/ads/commercial';
import { handleUnauthorized } from '@/lib/api/client';
import { AdFlowAction, AdFlowStage, mapAdFlowError } from '@/lib/api/adFlowErrors';

export type AdFlowStatus = 'loading' | 'playing' | 'no-ads' | 'reauth' | 'blocked';

/**
 * Tope de avances automáticos (por error) consecutivos sin que el usuario
 * llegue a ver un anuncio. Protege contra bucles silenciosos si el backend
 * queda devolviendo, por ejemplo, 410 una y otra vez.
 */
const MAX_AUTO_ADVANCES = 3;
const RETRY_BACKOFF_MS = 800;

export const TRY_LATER_MESSAGE =
  'Estamos teniendo problemas para mostrarte anuncios. Inténtalo de nuevo en unos minutos.';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AttemptResult<T> = { ok: true; value: T } | { ok: false; action: AdFlowAction };

/** Ejecuta `fn`, aplicando el mapeador ante error; reintenta in-place si toca RETRY_SAME. */
async function runWithRetry<T>(stage: AdFlowStage, fn: () => Promise<T>): Promise<AttemptResult<T>> {
  let attempt = 1;
  for (;;) {
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (error) {
      const action = mapAdFlowError(error, { stage, attempt });
      if (action.type === 'RETRY_SAME') {
        await delay(RETRY_BACKOFF_MS * attempt);
        attempt += 1;
        continue;
      }
      return { ok: false, action };
    }
  }
}

export interface UseAdFlowResult {
  status: AdFlowStatus;
  currentAd: AdForConsumerDTO | null;
  isLoadingNext: boolean;
  isLiking: boolean;
  /** Motivo mostrado cuando status === 'blocked'. */
  blockedMessage: string | null;
  /** Avance normal (montaje inicial, o después de completar/likear un anuncio). Resetea el guard anti-bucle. */
  loadNext: () => void;
  /** Descarta la sessionUUID/anuncio actual y pide el siguiente. Cuenta para el guard anti-bucle. */
  discardSessionAndFetchNext: (notice?: string) => void;
  /** Da like al anuncio actual. Devuelve la respuesta en éxito real; null si el error ya fue manejado internamente. */
  like: () => Promise<AdLikedResponse | null>;
  /** Sale de 'blocked'/'no-ads' e intenta de nuevo desde cero. */
  retry: () => void;
}

/**
 * Máquina de estados del flujo "ver anuncios" del consumer:
 *   GET /adLike/next -> reproducir -> (POST /adLike/like) -> GET /adLike/next ...
 *
 * Centraliza el manejo de errores vía `mapAdFlowError` (src/lib/api/adFlowErrors.ts)
 * en vez de repartir try/catch por componentes. La sessionUUID vive únicamente
 * dentro de `currentAd` y nunca se reutiliza tras un error que la invalide:
 * cualquier avance pasa primero por descartar el anuncio actual.
 */
export function useAdFlow(): UseAdFlowResult {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AdFlowStatus>('loading');
  const [currentAd, setCurrentAd] = useState<AdForConsumerDTO | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingNextRef = useRef(false);
  const autoAdvancesRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function dispatch(action: AdFlowAction) {
    switch (action.type) {
      case 'ADVANCE_TO_NEXT':
        discardSessionAndFetchNext();
        return;
      case 'ADVANCE_WITH_NOTICE':
        discardSessionAndFetchNext(action.message);
        return;
      case 'KEEP_WATCHING':
        toast(action.message);
        return;
      case 'NO_ADS_AVAILABLE':
        setCurrentAd(null);
        setStatus('no-ads');
        return;
      case 'REAUTH':
        setStatus('reauth');
        void handleUnauthorized();
        return;
      case 'FATAL':
        setStatus('blocked');
        setBlockedMessage(action.message);
        return;
      case 'RETRY_SAME':
        // runWithRetry ya lo consume internamente; nunca debería llegar acá.
        return;
    }
  }

  async function fetchNext() {
    if (isFetchingNextRef.current) return;
    isFetchingNextRef.current = true;
    setIsLoadingNext(true);
    setStatus((prev) => (prev === 'blocked' ? prev : 'loading'));

    const result = await runWithRetry('next', () => adService.getNextAd());

    isFetchingNextRef.current = false;
    if (!isMountedRef.current) return;
    setIsLoadingNext(false);

    if (result.ok) {
      if (result.value) {
        // El usuario vuelve a tener un anuncio real enfrente: se corta cualquier racha de avances automáticos.
        autoAdvancesRef.current = 0;
        setCurrentAd(result.value);
        setStatus('playing');
      } else {
        setCurrentAd(null);
        setStatus('no-ads');
      }
      return;
    }
    dispatch(result.action);
  }

  function discardSessionAndFetchNext(notice?: string) {
    if (notice) toast(notice);
    setCurrentAd(null);

    autoAdvancesRef.current += 1;
    if (autoAdvancesRef.current > MAX_AUTO_ADVANCES) {
      setStatus('blocked');
      setBlockedMessage(TRY_LATER_MESSAGE);
      return;
    }
    void fetchNext();
  }

  function loadNext() {
    autoAdvancesRef.current = 0;
    setBlockedMessage(null);
    void fetchNext();
  }

  function retry() {
    loadNext();
  }

  async function like(): Promise<AdLikedResponse | null> {
    const ad = currentAd;
    if (!ad) return null;

    setIsLiking(true);
    const result = await runWithRetry('like', () => adService.likeAd(ad.id, ad.sessionUUID));
    if (!isMountedRef.current) return null;
    setIsLiking(false);

    if (result.ok) {
      autoAdvancesRef.current = 0;
      queryClient.invalidateQueries({ queryKey: ['consumer', 'initialData'] });
      return result.value;
    }

    dispatch(result.action);
    return null;
  }

  // Cargar el primer anuncio al montar.
  useEffect(() => {
    void fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    currentAd,
    isLoadingNext,
    isLiking,
    blockedMessage,
    loadNext,
    discardSessionAndFetchNext,
    like,
    retry,
  };
}
