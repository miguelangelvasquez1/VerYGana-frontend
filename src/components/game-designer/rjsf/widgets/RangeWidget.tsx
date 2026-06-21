// components/widgets/RangeWidget.tsx
import React from 'react';
import { WidgetProps } from '@rjsf/utils';

export const RangeWidget: React.FC<WidgetProps> = ({ id, value, onChange, disabled, readonly, schema }) => {
  const min = schema.minimum;
  const max = schema.maximum;
  const step = (schema as any).multipleOf ?? 1;
  const current = value ?? (min ?? 0);

  return (
    <div className="space-y-1.5">
      <input
        id={id}
        type="range"
        className="w-full accent-violet-600"
        value={current}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled || readonly}
      />
      <div className="flex justify-between text-xs text-gray-500">
        {min !== undefined && <span>{min}</span>}
        <span className="font-medium text-gray-700">{current}</span>
        {max !== undefined && <span>{max}</span>}
      </div>
    </div>
  );
};

export default RangeWidget;
