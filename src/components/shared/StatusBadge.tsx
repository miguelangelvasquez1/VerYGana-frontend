import type { Tone } from '@/lib/labels/taxCompliance';

const TONE_CLASSES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

// Insignia de estado. El texto y el tono salen del diccionario de `lib/labels/taxCompliance`.
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
