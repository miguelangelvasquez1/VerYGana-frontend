// components/VideoAdPlayer.tsx
'use client'
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import VideoControls from './VideoControls';
import { useNextAd, useLikeAd } from '@/hooks/ads/mutations';
import { AdForConsumerDTO, AdLikedResponse } from '@/types/ads/commercial';
import { levelService } from '@/services/LevelService';
import { levelKeys } from '@/hooks/useLevelProfile';
import type { XpRewardData } from '@/components/levels/XpRewardToast';
import toast from 'react-hot-toast';

interface Props {
  onXpReward?: (data: XpRewardData) => void;
}

export default function VideoAdPlayer({ onXpReward }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isLiked, setIsLiked] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [currentAd, setCurrentAd] = useState<AdForConsumerDTO | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: getNextAd, isPending: isLoadingAd } = useNextAd();
  const { mutate: likeAd, isPending: isLikingAd } = useLikeAd();

  // Cargar el primer anuncio al montar el componente
  useEffect(() => {
    loadNextAd();
  }, []);

  // Bloquear scroll de la página mientras el componente está montado
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const loadNextAd = () => {
    getNextAd(undefined, {
      onSuccess: (ad: AdForConsumerDTO| null) => {
        setIsInitialized(true);
        if (ad) {
          setCurrentAd(ad);
          resetAdState();
        } else {
          setCurrentAd(null);
        }
      },
      onError: (error: unknown) => {
        setIsInitialized(true);
        console.error('Error cargando anuncio:', error);
      }
    });
  };

  const resetAdState = () => {
    setProgress(0);
    setWatchTime(0);
    setIsLiked(false);
    setShowReward(false);
    setHasReachedEnd(false);
    setIsPlaying(true);
    setIsExpanded(false);
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
        video.load();

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

      const handleEnded = () => {
        setHasReachedEnd(true);
        setProgress(100);
        setIsPlaying(false);
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
      video.addEventListener('ended', handleEnded);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
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
            setHasReachedEnd(true);
            setIsPlaying(false);
          }, 300);
        }
      }, 50);

      return () => clearInterval(timerRef.current!);
    }
  }, [currentAd?.id, isPlaying, hasReachedEnd]);

  const handleLike = () => {
    if (!currentAd || isLikingAd || isLiked || !hasReachedEnd) return;
    likeAd(
      {
        adId: currentAd.id,
        sessionUUID: currentAd.sessionUUID
      },
      {
        onSuccess: (res: AdLikedResponse) => {
          setIsLiked(true);

          if (res.rewardAmount > 0) {
            setRewardAmount(res.rewardAmount);
            setShowReward(true);
          } else {
            setTimeout(() => loadNextAd(), 500);
          }

          const token = session?.accessToken as string | undefined;
          if (token && onXpReward) {
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
                currentLevel: profile.currentLevel,
                xpTotal:      profile.xpTotal,
                xpToNextLevel: profile.xpToNextLevel,
              });
            }).catch(() => {/* non-critical */});
          }
        },
        onError: (error: unknown) => {
          const message = (error as any)?.response?.data?.message;
          toast.error('No se pudo registrar el like. Intenta nuevamente.');
          console.error('Error al dar like:', message);
        }
      }
    );
  };

  const handleVisitAd = () => {
    if (!currentAd?.targetUrl) return;

    window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
  };


  const handleShare = async () => {
    if (!currentAd) return;

    try {
      await navigator.clipboard.writeText(currentAd.targetUrl);

      console.log('Link copiado:', currentAd.targetUrl);

      // opcional
      alert('Link copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando link', error);
    }
  };

  const handleSave = () => {
    if (!currentAd) return;
    console.log('Guardar:', currentAd);
  };

  if (!isInitialized || (isLoadingAd && !currentAd)) {
    return (
      <div className="flex justify-center items-center w-full h-full bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando anuncio...</p>
        </div>
      </div>
    );
  }

  if (!currentAd) {
    return (
      <div className="flex justify-center items-center w-full h-full bg-black">
        <div className="text-center text-white p-6">
          <p className="text-xl mb-4">No hay más anuncios disponibles</p>
        </div>
      </div>
    );
  }

  const isImage = currentAd.mediaType === 'IMAGE';
  const formattedLikes = new Intl.NumberFormat(navigator.language || 'en-US').format(currentAd.currentLikes);

  return (
    <div 
      ref={containerRef} 
      className="relative flex justify-center items-center w-full h-full overflow-hidden bg-black touch-none"
    >
      <div className="relative max-w-full max-h-[100dvh] overflow-hidden rounded-lg">

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Media */}
        {isImage ? (
          <img
            src={currentAd.contentUrl}
            alt={currentAd.title}
            className="max-w-full max-h-[calc(80dvh-1rem)] w-auto h-auto object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentAd.contentUrl}
            autoPlay
            loop={false}
            playsInline
            preload="metadata"
            className="max-w-full h-[calc(80dvh-1rem)] w-auto object-contain"
          />
        )}

        {/* End of ad overlay - Like prompt */}
        {hasReachedEnd && !isLiked && (
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
            `}</style>
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-[2px]">
              <div className="relative text-center bg-white/10 backdrop-blur-md rounded-2xl px-8 py-7 mx-4 overflow-hidden">

                {/* Corazones flotantes al procesar */}
                {isLikingAd && [0, 1, 2, 3, 4].map((i) => (
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

                {/* Icono */}
                <div
                  className="text-5xl mb-3"
                  style={{ animation: isLikingAd ? 'none' : 'heartPulse 1.4s ease-in-out infinite' }}
                >
                  ❤️
                </div>

                <p className="text-white text-xl font-bold mb-1">¡Anuncio completado!</p>
                <p className="text-white/80 text-sm mb-6">
                  Dale <span className="text-pink-400 font-bold">Me Gusta</span> para recibir tu recompensa
                </p>

                <button
                  onClick={handleLike}
                  disabled={isLikingAd}
                  className={`px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold text-lg transition-all duration-200 disabled:cursor-not-allowed
                    ${isLikingAd ? 'scale-95 opacity-80' : 'hover:scale-105 active:scale-95'}`}
                >
                  {isLikingAd ? (
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
        {isLiked && isLoadingAd && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Cargando siguiente anuncio...</p>
            </div>
          </div>
        )}

        {/* Media Info Overlay */}
        <div className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-3 pb-4 md:pb-4 z-20 pt-5 
          ${isExpanded ? 'bg-gradient-to-t from-black/60 to-transparent' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">
                  {currentAd.commercialName?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="text-white font-semibold text-xs drop-shadow-lg">
                {currentAd.commercialName}
              </span>
            </div>
          </div>

          <h3 className="text-white font-bold text-base mb-1 leading-tight drop-shadow-lg">
            {currentAd.title}
          </h3>
          
          <p
            className={`text-white/90 text-sm leading-snug drop-shadow-lg transition-all ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {currentAd.description}
          </p>

          {currentAd.description && currentAd.description.length > 100 && (
            <button
              onClick={() => setIsExpanded(v => !v)}
              className="text-blue-400 text-[10px] mt-0.5 font-medium"
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
                        loadNextAd();
                      }}
                      className="mt-1 w-full px-6 py-3 bg-amber-900/20 hover:bg-amber-900/30 active:scale-95 text-amber-900 font-bold rounded-2xl transition-all duration-150 border border-amber-900/20"
                    >
                      Ver siguiente anuncio →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 md:hidden z-30">
          <VideoControls
            onVisit={handleVisitAd}
            onShare={handleShare}
            onSave={handleSave}
            size="md"
          />
        </div>
      </div>

      {/* Desktop controls */}
      <div className="hidden md:flex flex-col justify-center ml-4">
        <VideoControls
          onVisit={handleVisitAd}
          onShare={handleShare}
          onSave={handleSave}
          size="lg"
        />
      </div>
    </div>
  );
}