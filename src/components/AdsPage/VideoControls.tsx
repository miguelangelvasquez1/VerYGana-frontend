interface VideoControlsProps {
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  onNext: () => void;
}

export default function VideoControls({ 
  isLiked, 
  onLike, 
  onShare, 
  onSave, 
  onNext 
}: VideoControlsProps) {

  const controlButtons = [
    {
      icon: isLiked ? "❤️" : "🤍",
      label: "Like",
      count: "45.6K",
      onClick: onLike,
      active: isLiked,
      className: isLiked ? "animate-pulse" : ""
    },
    // {
    //   icon: "💬",
    //   label: "Comentar",
    //   count: "1.2K",
    //   onClick: () => {/* Handle comment */},
    //   active: false
    // },
    {
      icon: "🔄",
      label: "Compartir",
      count: "856",
      onClick: onShare,
      active: false
    },
    {
      icon: "📥",
      label: "Guardar",
      count: "",
      onClick: onSave,
      active: false
    }
  ];

  return (
    <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 z-30">
      {controlButtons.map((button, index) => (
        <div key={index} className="flex flex-col items-center gap-0.5">
          <button
            onClick={button.onClick}
            className={`
              w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full 
              flex items-center justify-center border border-white/20
              hover:bg-black/60 hover:scale-110 
              active:scale-95 transition-all duration-200
              ${button.active ? 'bg-red-500/20 border-red-400' : ''}
              ${button.className}
            `}
          >
            <span className="text-xl filter drop-shadow-lg">
              {button.icon}
            </span>
          </button>
          {button.count && (
            <span className="text-white text-xs font-medium drop-shadow-lg">
              {button.count}
            </span>
          )}
        </div>
      ))}

      {/* Next video button */}
      <div className="flex flex-col items-center gap-0.5 mt-1">
        <button
          onClick={onNext}
          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 
                   rounded-full flex items-center justify-center
                   hover:scale-110 active:scale-95 transition-all duration-200
                   shadow-lg hover:shadow-xl"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <span className="text-white text-xs font-medium drop-shadow-lg">
          Siguiente
        </span>
      </div>

      {/* Reward indicator */}
      <div className="mt-2 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full border border-green-400">
        <div className="flex items-center gap-1">
          <span>💰</span>
          <span>+$2.50</span>
        </div>
      </div>
    </div>
  );
}