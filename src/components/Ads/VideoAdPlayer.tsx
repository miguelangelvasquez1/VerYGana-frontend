// components/VideoAdPlayer.tsx
'use client'
import { useEffect, useRef, useState, useMemo } from 'react';
import VideoControls from './VideoControls';
import { useActiveAds } from '@/hooks/ads/querys';
import { AdForConsumerDTO } from '@/types/ads/advertiser';

interface VideoAdPlayerProps {
  page?: number;
  size?: number;
}

export default function VideoAdPlayer({ page = 0, size = 10 }: VideoAdPlayerProps) {
  // ✅ MEJORA 1: Solo hacer la petición UNA VEZ al montar el componente
  const { data, isLoading, isError, error } = useActiveAds(page, size);

  // ✅ MEJORA 2: Usar useMemo para evitar recalcular en cada render
  const adsArray = useMemo<AdForConsumerDTO[]>(() => {
    if (!data) return [];
    
    // Soportar diferentes estructuras de respuesta
    if ((data as any).content) return (data as any).content;
    if ((data as any).items) return (data as any).items;
    if (Array.isArray(data)) return data;
    
    return [];
  }, [data]);

  const medias = useMemo(() => 
    adsArray.map((ad) => ({
      id: ad.id,
      src: ad.contentUrl,
      title: ad.title,
      description: ad.description ?? '',
      brand: ad.advertiserName ?? 'Anunciante',
      likes: ad.currentLikes ?? 0,
      type: ad.mediaType ?? 'VIDEO',
      duration: ad.mediaType === 'VIDEO' ? 0 : 30,
    })),
    [adsArray]
  );

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isLiked, setIsLiked] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwitching = useRef(false);

  const currentMedia = medias[currentMediaIndex];

  // Formatear likes
  const formattedLikes = useMemo(() => {
    if (!currentMedia) return '0';
    return new Intl.NumberFormat(navigator.language || 'en-US').format(currentMedia.likes);
  }, [currentMedia?.likes]);

  // ✅ MEJORA 3: Navegación con wheel y touch (solo se configura una vez)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || medias.length === 0) return;

    const handleWheel = (e: WheelEvent) => {
      if (isSwitching.current) return;

      if (Math.abs(e.deltaY) > 50) {
        isSwitching.current = true;
        setTimeout(() => { isSwitching.current = false; }, 500);

        if (e.deltaY > 0) handleNext();
        else handlePrev();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const diff = touchStartY.current - e.changedTouches[0].clientY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) handleNext();
        else handlePrev();
      }

      touchStartY.current = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [medias.length]);

  // Reset cuando cambia la lista de medias
  useEffect(() => {
    if (medias.length === 0) {
      setCurrentMediaIndex(0);
      setIsPlaying(false);
      return;
    }
    if (currentMediaIndex >= medias.length) {
      setCurrentMediaIndex(0);
    }
  }, [medias.length, currentMediaIndex]);

  // Reset estados cuando cambia el media actual
  useEffect(() => {
    if (!currentMedia) return;
    
    setProgress(0);
    setWatchTime(0);
    setIsLiked(false);
    setShowReward(false);
    setDuration(currentMedia.type === 'IMAGE' ? 30 : 0);
  }, [currentMedia?.id]);

  // ✅ MEJORA 4: Manejo de reproducción optimizado
  useEffect(() => {
    if (!currentMedia) return;

    const isImage = currentMedia.type === 'IMAGE';
    const video = videoRef.current;

    // Limpiar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isImage && video) {
      // VIDEO
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
        handleNext();
      };

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime || 0;
        const dur = video.duration || duration || 30;
        
        if (dur > 0) {
          setProgress((currentTime / dur) * 100);
          setWatchTime(currentTime);

          // Mostrar recompensa al 80%
          if (currentTime / dur > 0.8 && !showReward) {
            setShowReward(true);
            setTimeout(() => setShowReward(false), 3000);
          }
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
      // IMAGEN
      const imageDuration = 30;
      const startTime = Date.now() - (watchTime * 1000);
      
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed >= imageDuration) {
          clearInterval(timerRef.current!);
          handleNext();
          return;
        }

        setWatchTime(elapsed);
        setProgress((elapsed / imageDuration) * 100);

        // Mostrar recompensa al 80%
        if (elapsed / imageDuration > 0.8 && !showReward) {
          setShowReward(true);
          setTimeout(() => setShowReward(false), 3000);
        }
      }, 1000 / 60);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentMedia?.id, isPlaying]);

  // Handlers
  const togglePlayPause = async () => {
    const isImage = currentMedia?.type === 'IMAGE';
    
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
    setIsLiked(prev => !prev);
    // TODO: Llamar API para registrar like
  };

  const handleNext = () => {
    setCurrentMediaIndex(prev => (prev < medias.length - 1 ? prev + 1 : 0));
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentMediaIndex(prev => (prev > 0 ? prev - 1 : medias.length - 1));
    setIsPlaying(true);
  };

  const handleShare = () => {
    // TODO: Implementar compartir
    console.log('Compartir:', currentMedia);
  };

  const handleSave = () => {
    // TODO: Implementar guardar
    console.log('Guardar:', currentMedia);
  };

  // Estados de carga/error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-black">
        <div className="text-center text-red-500 p-6">
          <p className="text-xl mb-2">⚠️ Error cargando anuncios</p>
          <p className="text-sm">{(error as any)?.message ?? 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  if (!currentMedia) {
    return (
      <div className="flex justify-center items-center w-full h-[100dvh] bg-black">
        <p className="text-white text-center p-6">No hay anuncios activos disponibles.</p>
      </div>
    );
  }

  const isImage = currentMedia.type === 'IMAGE';

  return (
    <div 
      ref={containerRef} 
      className="relative flex justify-center items-center w-full h-[100dvh] overflow-hidden bg-black touch-none"
    >
      <div className="relative w-full max-w-[500px] h-full overflow-hidden rounded-none md:rounded-2xl md:my-5">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Media */}
        {isImage ? (
          <img
            src={currentMedia.src}
            alt={currentMedia.title}
            className="w-full h-full object-contain bg-black cursor-pointer"
            onClick={togglePlayPause}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentMedia.src}
            autoPlay
            loop={false}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black cursor-pointer"
            onClick={togglePlayPause}
          />
        )}

        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
            <button 
              onClick={togglePlayPause} 
              className="p-4 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all hover:scale-110"
            >
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Media Info Overlay */}
        <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pb-6 z-20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {currentMedia.brand?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="text-white font-semibold text-sm drop-shadow-lg">
                {currentMedia.brand}
              </span>
            </div>
          </div>

          <h3 className="text-white font-bold text-lg mb-2 leading-tight drop-shadow-lg">
            {currentMedia.title}
          </h3>
          <p className="text-white/90 text-sm mb-3 leading-snug drop-shadow-lg line-clamp-2">
            {currentMedia.description}
          </p>

          <div className="flex items-center gap-4 text-white/80 text-xs font-medium">
            <span className="flex items-center gap-1">
              <span>❤️</span> {formattedLikes}
            </span>
            <span className="flex items-center gap-1">
              <span>⏱️</span> {Math.floor(watchTime)}s / {Math.floor(duration)}s
            </span>
          </div>
        </div>

        {/* Reward notification */}
        {showReward && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="font-bold text-lg">¡Recompensa desbloqueada!</p>
                  <p className="text-sm opacity-90">Sigue viendo para ganar más</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile controls */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-4 md:hidden z-30">
          <VideoControls
            isLiked={isLiked}
            onLike={handleLike}
            onShare={handleShare}
            onSave={handleSave}
            onNext={handleNext}
            onPrev={handlePrev}
            size="md"
          />
        </div>
      </div>

      {/* Desktop controls */}
      <div className="hidden md:block absolute right-8">
        <VideoControls
          isLiked={isLiked}
          onLike={handleLike}
          onShare={handleShare}
          onSave={handleSave}
          onNext={handleNext}
          onPrev={handlePrev}
          size="lg"
        />
      </div>
    </div>
  );
}