'use client'
import { useState, useRef, useEffect } from 'react';
import VideoControls from './VideoControls';

const mockVideos = [
  {
    id: 1,
    src: "/ads/ad1.mp4",
    title: "Descubre nuestros productos increíbles",
    brand: "TechCorp",
    reward: "$2.50",
    duration: 30,
    views: "1.2M",
    likes: 45600
  },
  {
    id: 2,
    src: "/ads/ad2.mp4", 
    title: "La mejor oferta del año",
    brand: "ShopMart",
    reward: "$1.80",
    duration: 25,
    views: "890K",
    likes: 32100
  },
  {
    id: 3,
    src: "/ads/ad3.mp4",
    title: "Revoluciona tu estilo de vida",
    brand: "LifeStyle+",
    reward: "$3.20",
    duration: 40,
    views: "2.1M",
    likes: 67800
  }
];

export default function VideoAdPlayer() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const currentVideo = mockVideos[currentVideoIndex];
  const [formattedLikes, setFormattedLikes] = useState<string>(String(currentVideo.likes));

  useEffect(() => {
    // formatea según la localización real del navegador al montarse
    setFormattedLikes(new Intl.NumberFormat(navigator.language || 'en-US').format(currentVideo.likes));
  }, [currentVideo.likes]);

  useEffect(() => {
    // Esto ya corre en el cliente (window existe)
    const check = () => setIsMobile(window.innerWidth < 1024);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleEnded = () => {
        if (currentVideoIndex < mockVideos.length - 1) {
          setCurrentVideoIndex(prev => prev + 1);
          setProgress(0);
          setWatchTime(0);
          setIsLiked(false);
        } else {
          setCurrentVideoIndex(0);
        }
      };

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        setProgress((currentTime / duration) * 100);
        setWatchTime(currentTime);

        if (currentTime / duration > 0.8 && !showReward) {
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
    }
  }, [currentVideoIndex, showReward]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) video.pause();
      else video.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex justify-center items-center w-full h-full"
    >
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
            <button 
              onClick={togglePlayPause}
              className={`
                      absolute left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent bottom-18 md:bottom-0
                    `}            
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Video Info Overlay */}
        <div className={`
          absolute left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-20 bottom-18 md:bottom-0
        `}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{currentVideo.brand[0]}</span>
                </div>
                <span className="text-white font-semibold text-sm">{currentVideo.brand}</span>
              </div>
              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                +{currentVideo.reward}
              </div>
            </div>

            <h3 className="text-white font-semibold text-base mb-2 leading-tight">
              {currentVideo.title}
            </h3>

            <div className="flex items-center gap-4 text-gray-300 text-xs">
              <span>👁️ {currentVideo.views}</span>
    +         <span>❤️ {formattedLikes}</span>
              <span>⏱️ {Math.floor(watchTime)}s / {currentVideo.duration}s</span>
            </div>
          </div>
        </div>

        {/* Reward notification */}
        {showReward && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold">+{currentVideo.reward} ganado!</span>
              </div>
            </div>
          </div>
        )}

        {/* Controles integrados en móvil/mediano */}
        <div className="absolute inset-y-0 right-2 flex items-center justify-center md:hidden">
          <VideoControls 
            isLiked={isLiked}
            onLike={handleLike}
            onShare={() => {}}
            onSave={() => {}}
            onNext={() => {
              if (currentVideoIndex < mockVideos.length - 1) {
                setCurrentVideoIndex(prev => prev + 1);
                setProgress(0);
                setWatchTime(0);
                setIsLiked(false);
              }
            }}
            size="sm"
          />
        </div>
      </div>

      {/* Controles fuera del reproductor en pantallas grandes */}
      <div className="hidden md:flex">
        <VideoControls 
          isLiked={isLiked}
          onLike={handleLike}
          onShare={() => {}}
          onSave={() => {}}
          onNext={() => {
            if (currentVideoIndex < mockVideos.length - 1) {
              setCurrentVideoIndex(prev => prev + 1);
              setProgress(0);
              setWatchTime(0);
              setIsLiked(false);
            }
          }}
          size="lg"
        />
      </div>
    </div>
  );
}

