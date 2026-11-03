'use client';

// Pregunta Sí/No sin respuesta marcada al inicio (RN-7).
export function YesNoRadioGroup({
  name,
  legend,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  const errorId = `${name}-error`;
  const options = [
    { v: true, label: 'Sí' },
    { v: false, label: 'No' },
  ];
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-semibold text-gray-700">
        {legend}
        <span className="ml-0.5 text-red-500">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const checked = value === option.v;
          return (
            <label
              key={String(option.v)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                checked
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : error
                  ? 'border-red-300 bg-red-50/40 text-gray-600'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={String(option.v)}
                checked={checked}
                onChange={() => onChange(option.v)}
                className="h-4 w-4"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
