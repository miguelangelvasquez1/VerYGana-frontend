import { Heart, Share2, Bookmark, SkipForward } from "lucide-react";

export default function VideoControls({ isLiked, onLike, onShare, onSave, onNext, size = "lg" }: any) {
  const iconSize = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex flex-col items-center gap-4">
      <button 
        onClick={onLike}
        className="flex flex-col items-center text-white hover:scale-110 transition-transform"
      >
        <Heart className={`${iconSize} ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        <span className={`${textSize} mt-1`}>Me gusta</span>
      </button>

      <button 
        onClick={onShare}
        className="flex flex-col items-center text-white hover:scale-110 transition-transform"
      >
        <Share2 className={iconSize} />
        <span className={`${textSize} mt-1`}>Compartir</span>
      </button>

      <button 
        onClick={onSave}
        className="flex flex-col items-center text-white hover:scale-110 transition-transform"
      >
        <Bookmark className={iconSize} />
        <span className={`${textSize} mt-1`}>Guardar</span>
      </button>

      <button 
        onClick={onNext}
        className="flex flex-col items-center text-white hover:scale-110 transition-transform"
      >
        <SkipForward className={iconSize} />
        <span className={`${textSize} mt-1`}>Siguiente</span>
      </button>
    </div>
  );
}

