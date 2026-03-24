import { WidgetProps } from "@rjsf/utils";

export default function RadioWidget({
  id,
  value,
  disabled,
  readonly,
  onChange,
  options,
}: WidgetProps) {
  const { enumOptions = [] } = options;

  return (
    <div className="grid gap-3">
      {enumOptions.map((option) => {
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${selected
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"}
            `}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={selected}
              disabled={disabled || readonly}
              onChange={() => onChange(option.value)}
              className="accent-blue-600"
            />

            <span className="text-sm font-medium text-gray-700">
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}