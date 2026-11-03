// Fechas para mostrar. `dateTime.ts` convierte valores de <input> para enviar; esto es
// solo presentación, siempre en hora de Colombia.

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const PLAIN_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// "2026-10-01" -> "1 de octubre de 2026". Se arma desde la cadena: `new Date('2026-10-01')`
// es medianoche UTC y en Colombia se vería como el 30 de septiembre.
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) return '—';
  const match = PLAIN_DATE_RE.exec(value);
  if (!match) return '—';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return '—';
  }
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

// Día de hoy en Colombia como "AAAA-MM-DD" (el formato de <input type="date">).
export function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const bogotaDateTime = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatBogotaDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return bogotaDateTime.format(date);
}
