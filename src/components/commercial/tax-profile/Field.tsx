import type { ReactNode } from 'react';

// Ids de ayuda y error de un campo, para `aria-describedby`.
export function describedBy(id: string, hasError: boolean, hasHint: boolean): string | undefined {
  const ids = [hasHint ? `${id}-hint` : null, hasError ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

// Campo con etiqueta asociada (`htmlFor`), ayuda y error enlazados por id.
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldInputClass = (hasError?: boolean) =>
  `w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError
      ? 'border-red-400 focus:ring-red-300'
      : 'border-gray-200 focus:border-[#03548C] focus:ring-[#03548C]/40'
  }`;
