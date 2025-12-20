
// components/VideoControls.tsx
import { Heart, Share2, Bookmark, SkipForward } from "lucide-react";

interface VideoControlsProps {
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  onNext: () => void;
  onPrev?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoControls({ 
  isLiked, 
  onLike, 
  onShare, 
  onSave, 
  onNext, 
  size = "lg" 
}: VideoControlsProps) {
  const iconSize = size === "sm" ? "w-6 h-6" : size === "md" ? "w-7 h-7" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-4">
      <button 
        onClick={onLike}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          {/* Fondo con sombra para contraste */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>
          <Heart 
            className={`${iconSize} ${
              isLiked 
                ? "fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            }`} 
          />
        </div>
        <span className={`${textSize} mt-1 font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          Me gusta
        </span>
      </button>

      <button 
        onClick={onShare}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>
          <Share2 className={`${iconSize} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} />
        </div>
        <span className={`${textSize} mt-1 font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          Compartir
        </span>
      </button>

      <button 
        onClick={onSave}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>
          <Bookmark className={`${iconSize} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} />
        </div>
        <span className={`${textSize} mt-1 font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          Guardar
        </span>
      </button>

      <button 
        onClick={onNext}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>
          <SkipForward className={`${iconSize} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} />
        </div>
        <span className={`${textSize} mt-1 font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          Siguiente
        </span>
      </button>
    </div>
  );
}