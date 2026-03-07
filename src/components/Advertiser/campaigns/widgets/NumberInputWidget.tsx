// components/widgets/NumberInputWidget.tsx
import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Plus, Minus, Hash } from 'lucide-react';

export const NumberInputWidget: React.FC<WidgetProps> = (props) => {
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
  
  const minimum = schema.minimum ?? options?.minimum ?? 0;
  const maximum = schema.maximum ?? options?.maximum;
  const step = schema.multipleOf ?? options?.step ?? 1;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
    onChange(newValue);
  };
  
  const increment = () => {
    const currentValue = value ?? minimum;
    const newValue = currentValue + step;
    if (maximum === undefined || newValue <= maximum) {
      onChange(newValue);
    }
  };
  
  const decrement = () => {
    const currentValue = value ?? minimum;
    const newValue = currentValue - step;
    if (newValue >= minimum) {
      onChange(newValue);
    }
  };
  
  const canIncrement = !disabled && !readonly && (maximum === undefined || (value ?? 0) < maximum);
  const canDecrement = !disabled && !readonly && (value ?? 0) > minimum;
  
  return (
    <div className="w-full space-y-1.5">
      <div className="relative flex items-center">
        {/* Decrement button */}
        <button
          type="button"
          onClick={decrement}
          disabled={!canDecrement}
          className={`
            flex-shrink-0 h-10 w-10 flex items-center justify-center border rounded-l-lg transition-all
            ${canDecrement 
              ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' 
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          title="Decrementar"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        {/* Input field */}
        <div className="relative flex-1">
          <input
            type="number"
            id={id}
            value={value ?? ''}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || readonly}
            placeholder={placeholder}
            min={minimum}
            max={maximum}
            step={step}
            className={`
              w-full h-10 px-3 pr-8 border-y border-gray-300 text-center transition-all
              ${isFocused ? 'ring-2 ring-blue-100 border-blue-500' : ''}
              ${disabled || readonly 
                ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
                : 'bg-white'
              }
              focus:outline-none text-sm font-medium
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
          
          {/* Number icon */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Hash className="w-4 h-4" />
          </div>
        </div>
        
        {/* Increment button */}
        <button
          type="button"
          onClick={increment}
          disabled={!canIncrement}
          className={`
            flex-shrink-0 h-10 w-10 flex items-center justify-center border rounded-r-lg transition-all
            ${canIncrement 
              ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700' 
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          title="Incrementar"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Range indicator */}
      {!readonly && !disabled && (minimum !== undefined || maximum !== undefined) && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Min: {minimum}</span>
          {maximum !== undefined && <span>Max: {maximum}</span>}
        </div>
      )}
      
      {/* Current value badge (when focused) */}
      {isFocused && value !== undefined && value !== null && (
        <div className="text-xs">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            Valor actual: {value}
          </span>
        </div>
      )}
    </div>
  );
};

export default NumberInputWidget;