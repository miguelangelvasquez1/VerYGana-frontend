// components/VideoAdPlayer.tsx
'use client'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Facebook, Link2, Mail, MessageCircle, Play, Twitter } from 'lucide-react';
import VideoControls from './VideoControls';
import { useAdFlow } from '@/hooks/ads/useAdFlow';
import { adService } from '@/services/adService';
import { levelService } from '@/services/LevelService';
import { levelKeys } from '@/hooks/useLevelProfile';
import { shouldSubmitAdLike } from '@/lib/ads/likeEligibility';
import { buildShareUrls } from '@/lib/sharing/shareLinks';
import { shareOnce } from '@/lib/sharing/shareOnce';
import { getAdShareCount, incrementAdShareCount } from '@/lib/sharing/adShareCount';
import type { XpRewardData } from '@/components/levels/XpRewardToast';
import type { LevelProfile } from '@/types/level';
import { resolveLevelUp } from '@/utils/levelUp';

interface Props {
  onXpReward?: (data: XpRewardData) => void;
  // Nodo del padre (ver page.tsx) donde se pinta, vía portal, el canvas del modo ambiente: así
  // cubre el fondo detrás de la tarjeta del sidebar y del video por igual, en vez de quedar
  // encerrado en la columna de este componente.
  ambientContainer?: HTMLDivElement | null;
}

const SHARE_PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'twitter', label: 'X', Icon: Twitter },
  { key: 'email', label: 'Email', Icon: Mail },
] as const;

export default function VideoAdPlayer({ onXpReward, ambientContainer }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ambientCanvasRef = useRef<HTMLCanvasElement>(null);
  const ambientTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousPublicIdRef = useRef<string | null>(null);
  const isLikedRef = useRef(false);
  const likeRequestStartedRef = useRef(false);
  const finishMediaRef = useRef<() => void>(() => {});
  const submitLikeRef = useRef<() => void>(() => {});
  const hasReachedEndRef = useRef(false);
  const rewardAmountRef = useRef<number | null>(null);

  const recordShare = (adId: number) => {
    try {
      setShareCount(incrementAdShareCount(window.localStorage, adId));
    } catch {
      setShareCount((count) => count + 1);
      toast.error('No se pudo guardar el contador de compartidos en este dispositivo.');
    }
  };

  // Máquina de estados del flujo GET /adLike/next -> POST /adLike/like,
  // con manejo centralizado de errores (ver src/lib/api/adFlowErrors.ts).
  const {
    status: adFlowStatus,
    currentAd,
    isLoadingNext,
    isLiking,
    blockedMessage,
    loadNext,
    like: likeCurrentAd,
    retry: retryAdFlow,
  } = useAdFlow();
  const loadNextRef = useRef(loadNext);
  loadNextRef.current = loadNext;

  useEffect(() => {
    const publicId = session?.user?.publicId;
    if (!publicId) return;

    const previousPublicId = previousPublicIdRef.current;
    previousPublicIdRef.current = publicId;
    if (previousPublicId && previousPublicId !== publicId) {
      loadNextRef.current();
    }
  }, [session?.user?.publicId]);

  finishMediaRef.current = () => {
    hasReachedEndRef.current = true;
    setHasReachedEnd(true);
    setProgress(100);
    setIsPlaying(false);
    if (isLikedRef.current) submitLikeRef.current();
    if (isLikedRef.current && (rewardAmountRef.current ?? 0) > 0) {
      setShowReward(true);
    }
  };

  const handleMediaEnded = () => finishMediaRef.current();

  // Reinicia el estado de UI propio de "este" anuncio cuando useAdFlow entrega
  // uno nuevo. useLayoutEffect (no useEffect) para que corra antes del pintado
  // y no se alcance a ver, aunque sea un frame, el overlay del anuncio anterior
  // (like/reward/fin de video) superpuesto al contenido del nuevo.
  useLayoutEffect(() => {
    if (!currentAd) return;
    isLikedRef.current = false;
    likeRequestStartedRef.current = false;
    hasReachedEndRef.current = false;
    rewardAmountRef.current = null;
    setProgress(0);
    setWatchTime(0);
    setIsLiked(false);
    try {
      setShareCount(getAdShareCount(window.localStorage, currentAd.id));
    } catch {
      setShareCount(0);
      toast.error('No se pudo cargar el contador de compartidos guardado en este dispositivo.');
    }
    setRewardAmount(null);
    setShowReward(false);
    setHasReachedEnd(false);
    setIsPlaying(true);
    setIsExpanded(false);
    setMediaError(false);
    setShowSharePanel(false);
    // Solo debe resetear al cambiar de anuncio (nuevo id), no ante cualquier
    // cambio de referencia de `currentAd` (ej. si en el futuro se actualiza
    // in-place algún campo como currentLikes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAd?.id]);

  // El contenido del anuncio (contentUrl) no se pudo cargar: video/imagen roto,
  // 404, formato no soportado, etc. Detenemos la reproducción y ofrecemos saltar.
  const handleMediaError = () => {
    setMediaError(true);
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Efecto para manejar la reproducción del medio actual
  useEffect(() => {
    if (!currentAd) return;

    const isImage = currentAd.mediaType === 'IMAGE';
    const video = videoRef.current;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isImage && video) {
      if (!hasReachedEnd) {
        if (isPlaying) {
          const playPromise = video.play();
          if (playPromise) {
            playPromise.catch(() => setIsPlaying(false));
          }
        } else {
          video.pause();
        }
      }

      const handleLoadedMetadata = () => {
        setDuration(video.duration || 30);
      };

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime || 0;
        const dur = video.duration || duration || 30;

        if (dur > 0) {
          const progressPercent = (currentTime / dur) * 100;
          setProgress(progressPercent);
          setWatchTime(currentTime);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    } else if (isImage && isPlaying && !hasReachedEnd) {
      const imageDuration = currentAd.durationSeconds ?? 30;
      const startTime = Date.now() - watchTime * 1000;

      timerRef.current = setInterval(() => {
        const elapsed = Math.min((Date.now() - startTime) / 1000, imageDuration);
        setWatchTime(elapsed);
        setProgress((elapsed / imageDuration) * 100);

        if (elapsed >= imageDuration) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            finishMediaRef.current();
          }, 300);
        }
      }, 50);

      return () => clearInterval(timerRef.current!);
    }
  }, [currentAd?.id, isPlaying, hasReachedEnd]);

  // "Modo ambiente" (estilo YouTube): en vez de duplicar el <video>/<img> (doble descarga,
  // doble decodificación), se captura el fotograma actual del medio ya cargado sobre un
  // canvas minúsculo (64x36) y ese canvas se estira y desenfoca por CSS. El blur disimula la
  // baja resolución, así que no hace falta más detalle, y el resultado sigue el color y el
  // movimiento reales del anuncio en vez de quedar como un degradado fijo. No usa getImageData
  // (ni crossOrigin): dibujar un medio de otro origen en un canvas no necesita permiso CORS,
  // solo leer sus píxeles de vuelta, algo que este efecto nunca hace.
  useEffect(() => {
    if (!currentAd) return;
    const canvas = ambientCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const isImageAd = currentAd.mediaType === 'IMAGE';

    if (isImageAd) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = currentAd.contentUrl;
      return;
    }

    if (!isPlaying) return;

    const drawFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    drawFrame();
    ambientTimerRef.current = setInterval(drawFrame, 120);
    return () => {
      if (ambientTimerRef.current) {
        clearInterval(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }
    };
    // Solo debe reiniciar la captura al cambiar de anuncio (nuevo id) o al pausar/reanudar,
    // no ante cualquier cambio de referencia de `currentAd`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAd?.id, isPlaying]);

  submitLikeRef.current = () => {
      if (!currentAd || !shouldSubmitAdLike({
        hasReachedEnd: hasReachedEndRef.current,
        hasLiked: isLikedRef.current,
        requestStarted: likeRequestStartedRef.current,
      })) return;
      likeRequestStartedRef.current = true;
      likeCurrentAd().then((res) => {
        if (!res) {
          isLikedRef.current = false;
          likeRequestStartedRef.current = false;
          setIsLiked(false);
          return;
        }

        rewardAmountRef.current = res.rewardAmount;
        setRewardAmount(res.rewardAmount);
        if (res.rewardAmount > 0 && hasReachedEndRef.current) setShowReward(true);

        const token = session?.accessToken as string | undefined;
      if (token && onXpReward) {
        const prevLevel = queryClient.getQueryData<LevelProfile>(levelKeys.profile())?.currentLevel;
        Promise.all([
          levelService.getProfile(token),
          levelService.getHistory(token, 0, 1),
        ]).then(([profile, history]) => {
          queryClient.setQueryData(levelKeys.profile(), profile);
          const latest = history.content[0];
          if (!latest) return;
          onXpReward({
            activityType: 'VIDEO_WATCHED',
            xpEarned:     latest.xpEarned,
            multiplier:   latest.multiplierApplied,
            xpTotal:      profile.xpTotal,
            xpToNextLevel: profile.xpToNextLevel,
            ...resolveLevelUp(prevLevel, profile.currentLevel),
          });
        }).catch(() => {/* non-critical */});
      }
    });
  };

  const handleLike = () => {
    if (!currentAd || isLiking || isLikedRef.current) return;
    isLikedRef.current = true;
    setIsLiked(true);
    if (hasReachedEndRef.current) submitLikeRef.current();
  };

  const handleVisitAd = () => {
    if (!currentAd?.targetUrl) return;

    // Métrica "Remisión" del panel comercial: se registra antes de abrir la
    // URL, fire-and-forget (no bloquea la navegación si falla).
    adService.registerAdPageVisit(
      currentAd.id,
      currentAd.targetUrl,
      session?.accessToken as string | undefined,
    );

    window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePlayback = () => {
    if (hasReachedEnd || mediaError) return;
    setIsPlaying((playing) => !playing);
  };

  const handlePlaybackKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    handleTogglePlayback();
  };

  const handleShare = async () => {
    if (!currentAd) return;

    // En navegadores con la hoja nativa de compartir (sobre todo móviles), usarla: ya incluye
    // WhatsApp y el resto de apps instaladas, como lo hace cualquier app nativa. Si no existe
    // (la mayoría de escritorio), se abre el panel propio de abajo con los mismos destinos.
    if (typeof navigator.share === 'function') {
      try {
        const shared = await shareOnce(() =>
          navigator.share({ title: currentAd.title, url: currentAd.targetUrl }),
        );
        if (shared) recordShare(currentAd.id);
      } catch (error) {
        // AbortError y InvalidStateError son estados esperables de la hoja nativa.
        if (!(error instanceof Error) || !['AbortError', 'InvalidStateError'].includes(error.name)) {
          console.error('Error compartiendo', error);
        }
      }
      return;
    }

    setShowSharePanel(true);
  };

  const handleShareToPlatform = (platform: (typeof SHARE_PLATFORMS)[number]['key']) => {
    if (!currentAd) return;
    const urls = buildShareUrls(currentAd.title, currentAd.targetUrl);
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
    recordShare(currentAd.id);
    setShowSharePanel(false);
  };

  const handleCopyLink = async () => {
    if (!currentAd) return;

    try {
      await navigator.clipboard.writeText(currentAd.targetUrl);
      recordShare(currentAd.id);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando link', error);
    }
    setShowSharePanel(false);
  };

  // "Guardar" aún no existe: sin efecto. Antes escribía el anuncio entero (con su sessionUUID) en la consola (P-16).
  const handleSave = () => {};

  if (adFlowStatus === 'loading' && !currentAd) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a4ff] mx-auto mb-4"></div>
          <p className="text-white/90">Cargando anuncio...</p>
        </div>
      </div>
    );
  }

  if (adFlowStatus === 'reauth') {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a4ff] mx-auto mb-4"></div>
          <p className="text-white/90">Tu sesión expiró, redirigiendo...</p>
        </div>
      </div>
    );
  }

  if (adFlowStatus === 'blocked') {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="text-center text-white p-6 max-w-sm">
          <p className="text-xl mb-2">No pudimos cargar anuncios</p>
          <p className="text-sm text-white/70 mb-6">{blockedMessage}</p>
          <button
            onClick={retryAdFlow}
            className="px-6 py-3 bg-[#03548C] text-white rounded-full font-bold cursor-pointer hover:bg-[#024270] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!currentAd) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="text-center text-white p-6">
          <p className="text-xl mb-4">No hay más anuncios disponibles</p>
          <button
            onClick={retryAdFlow}
            disabled={isLoadingNext}
            className="px-6 py-3 bg-[#03548C] text-white rounded-full font-bold cursor-pointer hover:bg-[#024270] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoadingNext ? 'Buscando...' : 'Reintentar'}
          </button>
        </div>
      </div>
    );
  }

  const isImage = currentAd.mediaType === 'IMAGE';
  // Aviso "¡Anuncio completado!" a la vista: nada debe quedar encima de "Me gusta" ni robarle el toque.
  const showLikePrompt = hasReachedEnd && !isLiked;
  const formattedLikes = new Intl.NumberFormat(navigator.language || 'en-US')
    .format(currentAd.currentLikes + (isLiked ? 1 : 0));
  const formattedShares = new Intl.NumberFormat(navigator.language || 'en-US').format(shareCount);

  return (
    <>
      {/* Modo ambiente (estilo YouTube): el canvas recibe los fotogramas reales del anuncio
          (ver el efecto de arriba) y aquí solo se estira y desenfoca por CSS, así que el
          resplandor sigue el color y el movimiento del contenido en vez de verse como un
          degradado fijo. Se pinta vía portal en `ambientContainer` (un hijo directo de la
          fila, en page.tsx) y no aquí dentro: así cubre el fondo completo detrás de la tarjeta
          y del video por igual, en vez de quedar encerrado en el ancho de esta columna. */}
      {ambientContainer && createPortal(
        <>
          {/* El canvas ahora cubre una fila mucho más ancha que el video (que suele ser vertical):
              estirar su fotograma sin más deja ver, sin disimular, el color de cada borde del
              video (a menudo un fondo o letterbox más plano) justo donde antes no se notaba. Más
              resolución baja y más blur promedian esas diferencias en un resplandor parejo. */}
          <canvas
            ref={ambientCanvasRef}
            width={24}
            height={14}
            className="absolute inset-0 w-full h-full scale-150 blur-[140px] opacity-60 saturate-150 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1440]/45 via-black/15 to-black/55" />
        </>,
        ambientContainer,
      )}

      <div
        ref={containerRef}
        className="flex justify-center items-center w-full h-full overflow-hidden touch-pan-y"
      >

      {/* En el celular (< lg, mientras se ve la barra inferior) el marco llena el espacio del contenedor, que ya descuenta las barras: así el
          aviso del final tiene todo el ancho y el alto disponibles. Desde lg conserva el tamaño del medio. */}
      <div className="relative isolate w-full h-full lg:w-auto lg:h-auto max-w-full max-h-[100dvh] overflow-hidden rounded-2xl shadow-xl bg-black">

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-linear-to-r from-[#03548C] to-[#00a4ff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Media */}
        {isImage ? (
          <img
            src={currentAd.contentUrl}
            alt={currentAd.title}
            onError={handleMediaError}
            onClick={handleTogglePlayback}
            onKeyDown={handlePlaybackKeyDown}
            role="button"
            tabIndex={0}
            aria-label={isPlaying ? 'Pausar anuncio' : 'Reanudar anuncio'}
            className="w-full h-full cursor-pointer object-contain lg:w-auto lg:h-auto lg:max-w-full lg:max-h-[calc(86dvh-1rem)]"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentAd.contentUrl}
            autoPlay
            loop={false}
            playsInline
            preload="metadata"
            onClick={handleTogglePlayback}
            onKeyDown={handlePlaybackKeyDown}
            onEnded={handleMediaEnded}
            onError={handleMediaError}
            aria-label={isPlaying ? 'Toca para pausar el anuncio' : 'Toca para reanudar el anuncio'}
            tabIndex={0}
            className="w-full h-full cursor-pointer object-contain lg:max-w-full lg:w-auto lg:h-[calc(86dvh-1rem)]"
          />
        )}

        {!isPlaying && !hasReachedEnd && !mediaError && !showLikePrompt && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white shadow-xl backdrop-blur-sm">
              <Play className="h-8 w-8 translate-x-0.5" fill="currentColor" />
            </span>
          </div>
        )}
        {/* Contenido del anuncio no disponible - saltar al siguiente */}
        {mediaError && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80 backdrop-blur-[2px] p-6">
            <div className="text-center max-w-xs">
              <div className="text-5xl mb-3">📵</div>
              <p className="text-white text-lg font-bold mb-1">
                No se pudo cargar este anuncio
              </p>
              <p className="text-white/70 text-sm mb-6">
                Hubo un problema con el contenido. Puedes continuar con el siguiente.
              </p>
              <button
                onClick={loadNext}
                disabled={isLoadingNext}
                className="px-8 py-3.5 bg-gradient-to-r from-[#03548C] to-[#00a4ff] text-white rounded-full font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoadingNext ? 'Cargando...' : 'Ver siguiente anuncio →'}
              </button>
            </div>
          </div>
        )}

        {isLiked && hasReachedEnd && rewardAmount === 0 && !isLoadingNext && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-6">
            <button
              onClick={loadNext}
              disabled={isLoadingNext}
              className="min-h-12 rounded-full bg-[#03548C] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#024270] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ver siguiente anuncio →
            </button>
          </div>
        )}

        {/* End of ad overlay - Like prompt */}
        {showLikePrompt && (
          <>
            <style>{`
              @keyframes floatUp {
                0%   { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-90px) scale(0.4); }
              }
              @keyframes heartPulse {
                0%, 100% { transform: scale(1); }
                50%       { transform: scale(1.18); }
              }
              @keyframes modalPopIn {
                0%   { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes ctaGlow {
                0%, 100% { box-shadow: 0 0 20px 0 rgba(236,72,153,0.5); }
                50%       { box-shadow: 0 0 36px 8px rgba(236,72,153,0.7); }
              }
            `}</style>
            {/* "Me gusta" es obligatorio para la recompensa: en vez de un cuadro pequeño que se
                puede pasar por alto, cubre todo el reproductor como una pantalla final de
                videojuego/streaming, imposible de ignorar. */}
            <div className="absolute inset-0 flex items-center justify-center z-20 max-lg:z-[35] bg-black/60 backdrop-blur-md">

              {/* Corazones flotantes al procesar */}
              {isLiking && [0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="absolute text-2xl pointer-events-none select-none"
                  style={{
                    left: `${8 + i * 20}%`,
                    bottom: '28%',
                    animation: `floatUp 0.9s ease-out ${i * 0.11}s forwards`,
                  }}
                >
                  ❤️
                </span>
              ))}

              {/* En alturas cortas del celular (< lg, en horizontal) el contenido se compacta para caber entero */}
              <div
                className="relative text-center px-6"
                style={{ animation: 'modalPopIn 0.25s ease-out forwards' }}
              >
                {/* Icono */}
                <div
                  className="text-6xl mb-4 max-lg:[@media(max-height:30rem)]:text-4xl max-lg:[@media(max-height:30rem)]:mb-2"
                  style={{ animation: isLiking ? 'none' : 'heartPulse 1.4s ease-in-out infinite' }}
                >
                  ❤️
                </div>

                <p className="text-white text-2xl font-bold mb-2 drop-shadow-lg max-lg:[@media(max-height:30rem)]:text-xl">¡Anuncio completado!</p>
                <p className="text-white/80 text-base mb-8 max-lg:[@media(max-height:30rem)]:mb-4">
                  Dale <span className="text-pink-400 font-bold">Me Gusta</span> para recibir tu recompensa
                </p>

                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`px-10 py-5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold text-xl max-lg:[@media(max-height:30rem)]:py-3 max-lg:[@media(max-height:30rem)]:text-base transition-all duration-200 disabled:cursor-not-allowed cursor-pointer
                    ${isLiking ? 'scale-95 opacity-80' : 'hover:scale-105 active:scale-95'}`}
                  style={{ animation: isLiking ? 'none' : 'ctaGlow 1.8s ease-in-out infinite' }}
                >
                  {isLiking ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-bounce">❤️</span>
                      Procesando...
                    </span>
                  ) : '❤️ Me gusta'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading next ad overlay */}
        {isLiked && isLoadingNext && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Cargando siguiente anuncio...</p>
            </div>
          </div>
        )}

        {/* Media Info Overlay: Proporciones ajustadas estilo Reels/TikTok */}
        <div className={`absolute inset-x-0 bottom-0 z-20 p-5 pt-16 ${
          isExpanded
            ? 'max-h-[70%] overflow-y-auto overscroll-contain bg-gradient-to-t from-black/95 via-black/70 to-transparent'
            : 'bg-gradient-to-t from-black via-black/80 to-transparent'
        }`}>

          <div className="flex items-center gap-2 mb-1.5">
            {/* Avatar reducido de w-10 h-10 a w-8 h-8 */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shrink-0">
              <span className="text-sm font-bold text-white">
                {currentAd.commercialName?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            {/* Nombre de la empresa reducido a text-sm */}
            <span className="text-white font-semibold text-sm drop-shadow-lg">
              {currentAd.commercialName}
            </span>
          </div>

          {/* Título reducido a text-lg (antes text-2xl) */}
          <h3 className="text-white font-bold text-lg mb-1 leading-tight drop-shadow-lg">
            {currentAd.title}
          </h3>

          {/* Descripción reducida a text-sm (antes text-base) */}
          <p className={`max-w-[70ch] text-white text-sm leading-relaxed drop-shadow-lg ${
            isExpanded ? 'whitespace-normal' : 'line-clamp-2'
          }`}>
            {currentAd.description}
          </p>

          {currentAd.description && currentAd.description.length > 100 && (
              <button
                  onClick={() => setIsExpanded(v => !v)}
                  className="text-[#00a4ff] text-xs mt-1 font-medium cursor-pointer min-h-11 min-w-11 lg:min-h-0 lg:min-w-0"
              >
                {isExpanded ? 'Ver menos' : 'Ver más'}
              </button>
          )}
        </div>

        {/* Reward notification */}
        {showReward && rewardAmount !== null && (
          <>
            <style>{`
              @keyframes rewardPopIn {
                0%   { opacity: 0; transform: scale(0.4) translateY(30px); }
                70%  { transform: scale(1.06) translateY(-6px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes keyFloat {
                0%, 100% { transform: translateY(0)   rotate(-6deg); }
                50%       { transform: translateY(-10px) rotate(6deg); }
              }
              @keyframes cardShimmer {
                0%   { background-position: -200% center; }
                100% { background-position:  200% center; }
              }
              @keyframes sparkle {
                0%   { opacity: 0; transform: scale(0) rotate(0deg) translateY(0); }
                50%  { opacity: 1; transform: scale(1.3) rotate(180deg) translateY(-10px); }
                100% { opacity: 0; transform: scale(0.6) rotate(360deg) translateY(-36px); }
              }
            `}</style>

            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">

              {/* Chispas alrededor */}
              {['✨','⭐','✨','⭐','✨'].map((s, i) => (
                <span
                  key={i}
                  className="absolute text-xl select-none"
                  style={{
                    top:  `${22 + Math.sin(i * 1.3) * 22}%`,
                    left: `${12 + i * 17}%`,
                    animation: `sparkle 1.4s ease-out ${i * 0.13}s forwards`,
                  }}
                >
                  {s}
                </span>
              ))}

              {/* Tarjeta */}
              <div className="pointer-events-auto" style={{ animation: 'rewardPopIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                <div className="relative bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 px-9 py-7 rounded-3xl shadow-[0_24px_64px_rgba(245,158,11,0.75)] overflow-hidden">

                  {/* Glow exterior */}
                  <div className="absolute -inset-2 rounded-3xl bg-amber-400 opacity-30 blur-2xl" />

                  {/* Shimmer sweep */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-25"
                    style={{
                      background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.9) 50%, transparent 75%)',
                      backgroundSize: '200% auto',
                      animation: 'cardShimmer 2.2s linear infinite',
                    }}
                  />

                  <div className="relative flex flex-col items-center gap-3 text-center">

                    {/* Llave flotando */}
                    <div style={{ animation: 'keyFloat 2.2s ease-in-out infinite' }}>
                      <img
                        src="/logos/llave.png"
                        alt="llave"
                        className="w-24 h-24 drop-shadow-2xl"
                      />
                    </div>

                    {/* Texto */}
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-amber-900/75 font-bold mb-1">
                        ¡Recompensa obtenida!
                      </p>
                      <p className="text-6xl font-black text-amber-900 leading-none drop-shadow">
                        +{rewardAmount}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <img src="/logos/llave.png" alt="" className="w-5 h-5" />
                        <span className="text-base font-bold text-amber-900">llaves</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-900/65 font-medium mt-1">
                      Gracias por ver el anuncio 🎉
                    </p>

                    <button
                      onClick={() => {
                        setShowReward(false);
                        setRewardAmount(null);
                        loadNext();
                      }}
                      className="mt-1 w-full px-6 py-3 bg-amber-900/20 hover:bg-amber-900/30 active:scale-95 text-amber-900 font-bold rounded-2xl transition-all duration-150 border border-amber-900/20 cursor-pointer"
                    >
                      Ver siguiente anuncio →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Controles: riel vertical sobre el lado derecho del video, estilo TikTok/Shorts,
            flotando con fondo oscuro semitransparente + blur (mismo en mobile y escritorio). */}
        {!hasReachedEnd && !showLikePrompt && !showReward && !mediaError && !isLoadingNext && !isExpanded && (
          <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-30">
            <VideoControls
              onVisit={handleVisitAd}
              onLike={handleLike}
              onShare={handleShare}
              onSave={handleSave}
              isLiked={isLiked}
              isLiking={isLiking}
              likesCount={formattedLikes}
              sharesCount={formattedShares}
              size="lg"
            />
          </div>
        )}

        {/* Panel de compartir: solo aparece cuando el navegador no tiene la hoja nativa
            (navigator.share), por ejemplo en escritorio. Mismos destinos que esa hoja daría. */}
        {showSharePanel && (
          <div
            className="absolute inset-0 z-40 flex items-end justify-center md:items-center"
            onClick={() => setShowSharePanel(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-sm mx-4 mb-4 md:mb-0 rounded-2xl bg-[#0b1440]/95 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
            >
              <p className="text-white text-sm font-semibold mb-4 text-center">Compartir anuncio</p>
              <div className="grid grid-cols-4 gap-3">
                {SHARE_PLATFORMS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleShareToPlatform(key)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer min-h-11 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 group-active:scale-90 transition-all">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] text-white/80">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopyLink}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors cursor-pointer min-h-11"
              >
                <Link2 className="w-4 h-4" />
                Copiar enlace
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
