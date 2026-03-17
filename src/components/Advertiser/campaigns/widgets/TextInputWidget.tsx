// components/widgets/TextInputWidget.tsx
import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Type, AlertCircle } from 'lucide-react';

export const TextInputWidget: React.FC<WidgetProps> = (props) => {
  const { 
    id, 
    value, 
    onChange, 
    required, 
    readonly, 
    disabled,
    schema,
    placeholder,
    options 
  } = props;
  
  const [isFocused, setIsFocused] = useState(false);
  
  const maxLength = schema.maxLength || options?.maxLength;
  const minLength = schema.minLength || options?.minLength;
  const pattern = schema.pattern || options?.pattern;
  const currentLength = (value || '').length;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  
  const showCounter = maxLength && (isFocused || currentLength > 0);
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  
  return (
    <div className="w-full space-y-1.5">
      <div className="relative">
        <input
          type="text"
          id={id}
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || readonly}
          placeholder={placeholder}
          maxLength={maxLength}
          pattern={pattern}
          className={`
            w-full px-3 py-2 pr-10 border rounded-lg transition-all
            ${isFocused 
              ? 'border-blue-500 ring-2 ring-blue-100' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || readonly 
              ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
              : 'bg-white'
            }
            focus:outline-none text-sm
          `}
        />
        
        {/* Icon indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Type className="w-4 h-4" />
        </div>
      </div>
      
      {/* Character counter */}
      {showCounter && (
        <div className="flex items-center justify-between text-xs">
          <span className={`${isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            {currentLength} / {maxLength} caracteres
          </span>
          {isNearLimit && (
            <span className="text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Límite cercano
            </span>
          )}
        </div>
      )}
      
      {/* Validation hints */}
      {!readonly && !disabled && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {minLength && (
            <p>• Mínimo {minLength} caracteres</p>
          )}
          {pattern && (
            <p>• Debe cumplir formato específico</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TextInputWidget;