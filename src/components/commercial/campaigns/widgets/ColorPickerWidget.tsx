// components/widgets/ColorPickerWidget.tsx
import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Pipette, Copy, Check } from 'lucide-react';

export const ColorPickerWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, label, required, readonly, disabled } = props;
  
  const [color, setColor] = useState<string>(value || '#4A90E2');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (value) {
      setColor(value);
    }
  }, [value]);
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onChange(newColor);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor) || newColor === '') {
      setColor(newColor);
      onChange(newColor);
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="w-full">
      {/* Color Picker Input and Preview Row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Color Picker Input */}
        <div className="relative flex-shrink-0">
          <input
            type="color"
            id={id}
            value={color}
            onChange={handleColorChange}
            disabled={readonly || disabled}
            className="h-10 w-14 cursor-pointer rounded-md border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
            style={{ padding: '2px' }}
          />
          <Pipette className="absolute bottom-1 right-1 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Hex Input */}
        <input
          type="text"
          value={color}
          onChange={handleTextChange}
          placeholder="#4A90E2"
          maxLength={7}
          disabled={readonly || disabled}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
        />
        
        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={readonly || disabled}
          className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copiar color"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Color Preview Bar */}
      <div className="flex items-center gap-2">
        <div
          className="h-2 flex-1 rounded-full border border-gray-300 shadow-inner"
          style={{ backgroundColor: color }}
          title={color}
        />
        <span className="text-xs text-gray-500 font-mono">{color}</span>
      </div>
    </div>
  );
};

export default ColorPickerWidget;