// components/widgets/DecimalInputWidget.tsx
import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Hash } from 'lucide-react';

export const DecimalInputWidget: React.FC<WidgetProps> = (props) => {
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
  
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const minimum = schema.minimum ?? options?.minimum ?? 0;
  const maximum = schema.maximum ?? options?.maximum;
  const decimalPlaces = options?.decimalPlaces ?? 2;
  const prefix = options?.prefix ?? '';
  const suffix = options?.suffix;
  
  // Format number for display
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('es-CO', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };
  
  // Update display value when value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value));
    }
  }, [value, isFocused, decimalPlaces]);
  
  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused
    setDisplayValue(value !== undefined && value !== null ? String(value) : '');
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    // Parse and validate
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (displayValue === '') {
      onChange(undefined);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow numbers, decimal point, and minus sign
    if (/^-?\d*\.?\d*$/.test(inputValue) || inputValue === '') {
      setDisplayValue(inputValue);
    }
  };
  
  const isValid = value === undefined || value === null || (
    value >= minimum && (maximum === undefined || value <= maximum)
  );
  
  return (
    <div className="w-full space-y-1.5">
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm pointer-events-none">
            {prefix}
          </div>
        )}
        
        <input
          type="text"
          id={id}
          value={isFocused ? displayValue : (displayValue || '')}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || readonly}
          placeholder={placeholder || `${prefix}0${suffix || ''}`}
          className={`
            w-full px-3 py-2 border rounded-lg transition-all text-sm
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-12' : 'pr-10'}
            ${isFocused 
              ? 'border-blue-500 ring-2 ring-blue-100' 
              : isValid 
                ? 'border-gray-300 hover:border-gray-400' 
                : 'border-red-300 ring-2 ring-red-100'
            }
            ${disabled || readonly 
              ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
              : 'bg-white'
            }
            focus:outline-none font-medium
          `}
        />
        
        {/* Suffix */}
        {suffix && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            {suffix}
          </div>
        )}
        
        {/* Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Hash className="w-4 h-4" />
          </div>
      </div>
      
      {/* Range info */}
      {!readonly && !disabled && !isFocused && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Mínimo: {formatNumber(minimum)}</span>
          {maximum !== undefined && <span>Máximo: {formatNumber(maximum)}</span>}
        </div>
      )}
      
      {/* Validation error */}
      {!isValid && value !== undefined && value !== null && (
        <div className="text-xs text-red-600">
          {value < minimum && `El valor debe ser mayor o igual a ${formatNumber(minimum)}`}
          {maximum !== undefined && value > maximum && `El valor debe ser menor o igual a ${formatNumber(maximum)}`}
        </div>
      )}
      
      {/* Formatted preview (when focused) */}
      {isFocused && displayValue && !isNaN(parseFloat(displayValue)) && (
        <div className="text-xs text-gray-600">
          Vista previa: <span className="font-medium">{prefix}{formatNumber(parseFloat(displayValue))}{suffix}</span>
        </div>
      )}
    </div>
  );
};

export default DecimalInputWidget;