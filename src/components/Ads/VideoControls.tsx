// components/VideoControls.tsx
import { ExternalLink, Share2 } from "lucide-react";

interface VideoControlsProps {
  onVisit: () => void;
  onShare: () => void;
  onSave: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoControls({ 
  onVisit,
  onShare,
  onSave,
  size = "lg" 
}: VideoControlsProps) {

  const iconSize =
    size === "sm" ? "w-6 h-6" :
    size === "md" ? "w-7 h-7" :
    "w-8 h-8";

  const textSize =
    size === "sm" ? "text-xs" :
    size === "md" ? "text-sm" :
    "text-base";

  return (
    <div className="flex flex-col items-center gap-8">

      {/* BOTÓN VISITAR */}
      <button
        onClick={onVisit}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>

          <ExternalLink
            className={`${iconSize} text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]`}
          />
        </div>

        <span
          className={`${textSize} font-semibold mt-1 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
        >
          Visitar
        </span>
      </button>

      {/* COMPARTIR */}
      <button
        onClick={onShare}
        className="flex flex-col items-center group transition-transform hover:scale-110"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full scale-150 -z-10"></div>
          <Share2
            className={`${iconSize} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
          />
        </div>

        <span
          className={`${textSize} font-semibold mt-1 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
        >
          Compartir
        </span>
      </button>

    </div>
  );
}
