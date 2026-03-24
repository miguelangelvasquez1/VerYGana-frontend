// components/widgets/CheckboxWidget.tsx
import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Check } from 'lucide-react';

export const CheckboxWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, label, disabled, readonly } = props;
  
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={value || false}
        onClick={() => !disabled && !readonly && onChange(!value)}
        disabled={disabled || readonly}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
          ${value 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-white border-gray-300 hover:border-gray-400'
          }
          ${disabled || readonly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {value && <Check className="w-3 h-3 text-white" />}
      </button>
      <label 
        htmlFor={id}
        className="text-sm text-gray-700 cursor-pointer select-none"
        onClick={() => !disabled && !readonly && onChange(!value)}
      >
        {label}
      </label>
    </div>
  );
};

export default CheckboxWidget;