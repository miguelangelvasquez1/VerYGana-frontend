// components/VideoControls.tsx
'use client';
import { ExternalLink, Heart, Share2 } from 'lucide-react';

interface VideoControlsProps {
  onVisit: () => void;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  isLiked: boolean;
  isLiking: boolean;
  likesCount: string;
  sharesCount: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoControls({
  onVisit,
  onLike,
  onShare,
  isLiked,
  isLiking,
  likesCount,
  sharesCount,
  size = 'lg',
}: VideoControlsProps) {
  const iconSize =
    size === 'sm' ? 'w-6 h-6' :
    size === 'md' ? 'w-6 h-6' :
    'w-7 h-7';

  const btnSize =
    size === 'sm' ? 'w-10 h-10' :
    size === 'md' ? 'w-12 h-12' :
    'w-14 h-14';

  const labelSize =
    size === 'sm' ? 'text-[10px]' :
    size === 'md' ? 'text-xs' :
    'text-xs';

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Visit */}
      <button
        onClick={onVisit}
        className="flex flex-col items-center gap-1.5 group cursor-pointer min-h-11 min-w-11"
        aria-label="Visitar sitio del anunciante"
      >
        <div className={`${btnSize} rounded-full bg-black/50 backdrop-blur-md
          border border-white/15 flex items-center justify-center
          group-hover:bg-black/60 group-active:scale-90
          transition-all shadow-lg`}>
          <ExternalLink className={`${iconSize} text-white drop-shadow-md`} />
        </div>
        <span className={`${labelSize} font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]`}>Visitar</span>
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        disabled={isLiked || isLiking}
        aria-label={`Me gusta, ${likesCount} likes`}
        aria-pressed={isLiked}
        className="flex flex-col items-center gap-1.5 group cursor-pointer min-h-11 min-w-11 disabled:cursor-not-allowed"
      >
        <div className={`${btnSize} rounded-full bg-black/50 backdrop-blur-md
          border border-white/15 flex items-center justify-center
          group-hover:bg-black/60 group-active:scale-90
          transition-all shadow-lg`}>
          <Heart
            className={`${iconSize} drop-shadow-md transition-[color,transform] duration-200 ease-out motion-reduce:transition-none ${
              isLiked
                ? 'scale-110 text-[#fe2c55] fill-[#fe2c55]'
                : 'scale-100 text-white fill-none'
            }`}
            fill={isLiked ? 'currentColor' : 'none'}
          />
        </div>
        <span className={`${labelSize} font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]`}>{likesCount}</span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1.5 group cursor-pointer min-h-11 min-w-11"
        aria-label="Compartir"
      >
        <div className={`${btnSize} rounded-full bg-black/50 backdrop-blur-md
          border border-white/15 flex items-center justify-center
          group-hover:bg-black/60 group-active:scale-90
          transition-all shadow-lg`}>
          <Share2 className={`${iconSize} text-white drop-shadow-md`} />
        </div>
        <span className={`${labelSize} font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]`}>{sharesCount}</span>
      </button>

    </div>
  );
}