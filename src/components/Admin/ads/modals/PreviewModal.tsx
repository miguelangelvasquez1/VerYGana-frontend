import React from 'react';
import { XCircle } from 'lucide-react';

interface PreviewModalProps {
  url: string;
  type: string;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ url, type, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-4 right-4 bg-white/80 p-2 rounded-full z-10 hover:bg-white transition-colors" 
          onClick={onClose}
        >
          <XCircle className="w-6 h-6 text-gray-800" />
        </button>
        {type === 'VIDEO' ? (
          <video 
            src={url} 
            controls 
            autoPlay 
            className="mx-auto max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-xl shadow-2xl" 
          />
        ) : (
          <img 
            src={url} 
            alt="Preview" 
            className="mx-auto max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-xl shadow-2xl" 
          />
        )}
      </div>
    </div>
  );
};