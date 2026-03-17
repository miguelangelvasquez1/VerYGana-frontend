// components/widgets/ImagePreviewWidget.tsx
import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { AlertCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';

export const ImagePreviewWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, label, required, readonly, disabled, placeholder } = props;
  
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setImageError(false);
    setImageLoading(true);
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };
  
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  return (
    <div className="w-full">
      {/* URL Input */}
      <div className="relative mb-2">
        <input
          type="text"
          id={id}
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder || 'https://...'}
          disabled={readonly || disabled}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
        {value && isValidUrl(value) && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      
      {/* Image Preview - Compact */}
      {value && isValidUrl(value) && (
        <div>
          {imageLoading && (
            <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md h-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                <p className="text-xs text-gray-500">Cargando...</p>
              </div>
            </div>
          )}
          
          {!imageError && !imageLoading && (
            <div className="relative group">
              <img
                src={value}
                alt="Preview"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="w-full h-32 object-cover rounded-md border border-gray-200"
              />
              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Preview
              </div>
            </div>
          )}
          
          {imageError && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-800">Error al cargar</p>
                <p className="text-xs text-red-600 mt-0.5">Verifica la URL</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Invalid URL Warning */}
      {value && !isValidUrl(value) && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-orange-50 border border-orange-200 rounded-md">
          <AlertCircle className="w-3 h-3 text-orange-600 flex-shrink-0" />
          <p className="text-xs text-orange-700">URL inválida</p>
        </div>
      )}
      
      {/* Helper Text */}
      {!value && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <ImageIcon className="w-3 h-3" />
          <span>Ingresa una URL válida</span>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewWidget;