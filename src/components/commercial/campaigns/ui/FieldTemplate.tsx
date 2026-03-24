import { FieldTemplateProps } from "@rjsf/utils";
import { AlertCircle } from "lucide-react";

export default function CustomFieldTemplate({
  id,
  label,
  required,
  description,
  errors,
  rawErrors,
  children,
  hidden,
  displayLabel,
  schema,
}: FieldTemplateProps) {
  if (hidden) return <>{children}</>;

  const type = Array.isArray(schema.type)
    ? schema.type[0]
    : schema.type;

  const isContainerType = type === "object" || type === "array";

  if (isContainerType) {
    return <>{children}</>;
  }

  const hasErrors = Array.isArray(rawErrors) && rawErrors.length > 0;

  return (
    <div className="space-y-2">
      {displayLabel && label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1.5">*</span>}
        </label>
      )}

      {description && (
        <div className="text-xs text-gray-500 leading-relaxed">
          {description}
        </div>
      )}

      <div className="mt-1.5">{children}</div>

      {hasErrors && (
        <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {errors}
          </div>
        </div>
      )}
    </div>
  );
}