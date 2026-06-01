// components/VideoControls.tsx
'use client';
import { ExternalLink, Share2 } from 'lucide-react';

interface VideoControlsProps {
  onVisit: () => void;
  onShare: () => void;
  onSave: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function VideoControls({ onVisit, onShare, size = 'lg' }: VideoControlsProps) {
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
        className="flex flex-col items-center gap-1.5 group"
        aria-label="Visitar sitio del anunciante"
      >
        <div className={`${btnSize} rounded-full bg-white/10 backdrop-blur-md
          border border-white/20 flex items-center justify-center
          group-hover:bg-white/20 group-active:scale-90
          transition-all shadow-lg`}>
          <ExternalLink className={`${iconSize} text-white`} />
        </div>
        <span className={`${labelSize} font-semibold text-white drop-shadow`}>Visitar</span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1.5 group"
        aria-label="Compartir"
      >
        <div className={`${btnSize} rounded-full bg-white/10 backdrop-blur-md
          border border-white/20 flex items-center justify-center
          group-hover:bg-white/20 group-active:scale-90
          transition-all shadow-lg`}>
          <Share2 className={`${iconSize} text-white`} />
        </div>
        <span className={`${labelSize} font-semibold text-white drop-shadow`}>Compartir</span>
      </button>

    </div>
  );
}