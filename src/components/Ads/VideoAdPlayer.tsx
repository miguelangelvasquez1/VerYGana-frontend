'use client'
import { useEffect, useRef, useState } from 'react';
import VideoControls from './VideoControls';
import { useActiveAds } from '@/hooks/ads/querys';
import { AdForConsumerDTO } from '@/types/ads/advertiser';

export default function VideoAdPlayer({ page = 0, size = 10 }: { page?: number; size?: number }) {
  // Traer anuncios activos con tu hook
  const { data, isLoading, isError, error } = useActiveAds(page, size);

  // Obtener array de anuncios de forma robusta (data.content | data.items | data)
  const adsArray: AdForConsumerDTO[] = (data && (
    (data as any).content?.slice?.() ||
    (data as any).items?.slice?.() ||
    (Array.isArray(data) ? data : null) ||
    (data?? null)
  )) || [];

  // Convierte un AdResponseDTO a la forma que usa el reproductor
  const mapAdToVideo = (ad: AdForConsumerDTO) => ({
    id: ad.id,
    src: ad.contentUrl,
    title: ad.title,
    brand: ad.advertiserName ?? 'Anunciante',
    likes: ad.currentLikes ?? 0,
    duration: 30, // Duración fija o estimada
  });

  // Mapear anuncios a videos
  const videos = adsArray.map(mapAdToVideo);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formattedLikes, setFormattedLikes] = useState<string>('0');

  // Cuando cambia la lista de videos, asegurar índices válidos
  useEffect(() => {
    if (videos.length === 0) {
      setCurrentVideoIndex(0);
      setIsPlaying(false);
      return;
    }
    if (currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(0);
    }
    // resetear estados básicos al recibir nueva lista (opcional)
    setProgress(0);
    setWatchTime(0);
    setIsLiked(false);
    setShowReward(false);
  }, [videos.length]); // eslint-disable-line

  const currentVideo = videos[currentVideoIndex];

  // Formatear likes cuando cambia el anuncio
  useEffect(() => {
    if (!currentVideo) return;
    setFormattedLikes(new Intl.NumberFormat(navigator.language || 'en-US').format(currentVideo.likes));
  }, [currentVideo?.likes]);

  // Detectar mobile (ejemplo simple)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Manejar eventos del video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    // Si la fuente cambió, cargar y reproducir si corresponde
    // Nota: forzamos load para asegurar que el nuevo src se actualice
    video.load();
    if (isPlaying) {
      const p = video.play();
      if (p && typeof p.then === 'function') p.catch(() => setIsPlaying(false));
    }

    const handleEnded = () => {
      if (currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(prev => prev + 1);
      } else {
        // opción: volver al primero o pausar
        setCurrentVideoIndex(0);
      }
      setProgress(0);
      setWatchTime(0);
      setIsLiked(false);
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime || 0;
      const duration = video.duration || 30;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      } else {
        setProgress(0);
      }
      setWatchTime(currentTime);

      if (duration > 0 && currentTime / duration > 0.8 && !showReward) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoIndex, currentVideo, videos.length, isPlaying, showReward]);

  const togglePlayPause = async () => {
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
  };

  const handleLike = () => setIsLiked(prev => !prev);

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      setCurrentVideoIndex(0);
    }
    setProgress(0);
    setWatchTime(0);
    setIsLiked(false);
  };

  // Renderizado: loading / error / vacío
  if (isLoading) {
    return <div className="p-6 text-center">Cargando anuncios...</div>;
  }

  if (isError) {
    return <div className="p-6 text-center text-red-600">Error cargando anuncios: {(error as any)?.message ?? 'Desconocido'}</div>;
  }

  if (!currentVideo) {
    return <div className="p-6 text-center">No hay anuncios activos.</div>;
  }

  return (
    <div ref={containerRef} className="relative flex justify-center items-center w-full h-full">
      <div className="relative w-full max-w-[500px] h-full bg-black overflow-hidden rounded-2xl my-5">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          src={currentVideo.src}
          autoPlay
          loop={false}
          muted
          playsInline
          className="w-full h-full object-cover"
          onClick={togglePlayPause}
        />

        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button onClick={togglePlayPause} className="p-3 rounded-full bg-black/50">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Video Info Overlay */}
        <div className="absolute left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-20 bottom-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{currentVideo.brand?.[0] ?? 'A'}</span>
                </div>
                <span className="text-white font-semibold text-sm">{currentVideo.brand}</span>
              </div>
              {/* <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {currentVideo.reward}
              </div> */}
            </div>

            <h3 className="text-white font-semibold text-base mb-2 leading-tight">{currentVideo.title}</h3>

            <div className="flex items-center gap-4 text-gray-300 text-xs">
              {/* <span>👁️ {currentVideo.views}</span> */}
              <span>❤️ {formattedLikes}</span>
              <span>⏱️ {Math.floor(watchTime)}s / {currentVideo.duration}s</span>
            </div>
          </div>
        </div>

        {/* Reward notification */}
        {/* {showReward && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold">{currentVideo.reward} ganado!</span>
              </div>
            </div>
          </div>
        )} */}

        {/* Mobile controls */}
        <div className="absolute inset-y-0 right-2 flex items-center justify-center md:hidden">
          <VideoControls
            isLiked={isLiked}
            onLike={handleLike}
            onShare={() => {}}
            onSave={() => {}}
            onNext={handleNext}
            size="sm"
          />
        </div>
      </div>

      {/* Desktop controls */}
      <div className="hidden md:flex">
        <VideoControls
          isLiked={isLiked}
          onLike={handleLike}
          onShare={() => {}}
          onSave={() => {}}
          onNext={handleNext}
          size="lg"
        />
      </div>
    </div>
  );
}
