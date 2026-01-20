// components/VideoAdPlayer.tsx
'use client'
import { useEffect, useRef, useState } from 'react';
import VideoControls from './VideoControls';
import { useNextAd, useLikeAd } from '@/hooks/ads/mutations';
import { AdForConsumerDTO } from '@/types/ads/advertiser';
import toast from 'react-hot-toast';

export default function VideoAdPlayer() {
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: getNextAd, isPending: isLoadingAd } = useNextAd();
  const { mutate: likeAd, isPending: isLikingAd } = useLikeAd();

  // Cargar el primer anuncio al montar el componente
  useEffect(() => {
    loadNextAd();
  }, []);

  const loadNextAd = () => {
    getNextAd(undefined, {
      onSuccess: (ad) => {
        if (ad) {
          setCurrentAd(ad);
          resetAdState();
        } else {
          setCurrentAd(null);
        }
      },
      onError: (error) => {
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
      video.load();
      
      if (isPlaying) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => setIsPlaying(false));
        }
      } else {
        video.pause();
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
    } else if (isImage && isPlaying) {
      const imageDuration = 30;
      const startTime = Date.now() - (watchTime * 1000);
      
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed >= imageDuration) {
          clearInterval(timerRef.current!);
          setHasReachedEnd(true);
          setProgress(100);
          setIsPlaying(false);
          return;
        }

        setWatchTime(elapsed);
        const progressPercent = (elapsed / imageDuration) * 100;
        setProgress(progressPercent);
      }, 1000 / 60);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentAd?.id, isPlaying, hasReachedEnd]);

  const togglePlayPause = async () => {
    if (!currentAd || hasReachedEnd) return;
    
    const isImage = currentAd.mediaType === 'IMAGE';
    
    if (isImage) {
      setIsPlaying(prev => !prev);
    } else {
      const video = videoRef.current;
      if (!video) return;
      
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        try {
          await video.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    }
  };

  const handleLike = () => {
    if (!currentAd || isLikingAd || isLiked || !hasReachedEnd) return;
    likeAd(
      {
        adId: currentAd.id,
        sessionUUID: currentAd.sessionUUID
      },
      {
        onSuccess: (res) => {
          setIsLiked(true);

          if (res.rewardAmount > 0) {
            // Mostrar notificación de recompensa
            setRewardAmount(res.rewardAmount);
            setShowReward(true);
            setTimeout(() => {
              setShowReward(false);
              setRewardAmount(null);
              // Cargar el siguiente anuncio después de mostrar la recompensa
              loadNextAd();
            }, 3000);
          } else {
            // Si no hay recompensa, cargar el siguiente inmediatamente
            setTimeout(() => {
              loadNextAd();
            }, 500);
          }
        },
        onError: (error) => {
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


  const handleShare = () => {
    if (!currentAd) return;
    console.log('Compartir:', currentAd);
  };

  const handleSave = () => {
    if (!currentAd) return;
    console.log('Guardar:', currentAd);
  };

  if (isLoadingAd && !currentAd) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando anuncio...</p>
        </div>
      </div>
    );
  }

  if (!currentAd) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-black">
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
      className="relative flex justify-center items-center w-full h-[100dvh] overflow-hidden bg-black touch-none"
    >
      <div className="relative max-w-full max-h-[100dvh] overflow-hidden rounded-lg">

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Media */}
        {isImage ? (
          <img
            src={currentAd.contentUrl}
            alt={currentAd.title}
            className="max-w-full max-h-[calc(80dvh-1rem)] w-auto h-auto object-contain cursor-pointer"
            onClick={togglePlayPause}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentAd.contentUrl}
            autoPlay
            loop={false}
            muted
            playsInline
            preload="metadata"
            className="max-w-full h-[calc(80dvh-1rem)] w-auto object-contain cursor-pointer"
            onClick={togglePlayPause}
          />
        )}

        {/* Play overlay */}
        {!isPlaying && !hasReachedEnd && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
            <button 
              onClick={togglePlayPause} 
              className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110"
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* End of ad overlay - Like prompt */}
        {hasReachedEnd && !isLiked && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
            <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 mx-4">
              <p className="text-white text-xl font-bold mb-4">¡Anuncio completado!</p>
              <p className="text-white/90 mb-6">Dale like para continuar</p>
              <button
                onClick={handleLike}
                disabled={isLikingAd}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLikingAd ? 'Procesando...' : '❤️ Me gusta'}
              </button>
            </div>
          </div>
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
                  {currentAd.advertiserName?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="text-white font-semibold text-xs drop-shadow-lg">
                {currentAd.advertiserName}
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
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="animate-[scale-in_0.4s_ease-out]">
              <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white px-8 py-6 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.6)]">
                
                {/* Halo / glow */}
                <div className="absolute -inset-1 rounded-2xl bg-emerald-400 opacity-30 blur-xl"></div>

                <div className="relative flex items-center gap-4">
                  {/* Icono */}
                  <div className="text-4xl drop-shadow-md">
                    🎉
                  </div>

                  {/* Texto */}
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-wide opacity-90">
                      Recompensa obtenida
                    </p>

                    <p className="text-3xl font-extrabold leading-tight">
                      +{rewardAmount}
                      <span className="text-lg font-semibold ml-1">puntos</span>
                    </p>

                    <p className="text-xs opacity-90 mt-1">
                      Gracias por ver el anuncio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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