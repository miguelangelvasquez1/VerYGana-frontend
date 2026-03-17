// components/widgets/RadioWidget.tsx
import React from 'react';
import { WidgetProps } from '@rjsf/utils';

export const RadioWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, options, disabled, readonly } = props;
  
  const { enumOptions = [] } = options;
  
  return (
    <div className="space-y-2">
      {enumOptions.map((option: any) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative">
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => !disabled && !readonly && onChange(option.value)}
              disabled={disabled || readonly}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                ${value === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
                }
                ${disabled || readonly ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {value === option.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              )}
            </div>
          </div>
          <span className="text-sm text-gray-700">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default RadioWidget;