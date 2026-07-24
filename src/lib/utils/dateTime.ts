// El backend espera from/to como ZonedDateTime (ISO-8601 con offset, ej.
// "2026-07-13T10:00:00-05:00") — un string sin zona falla el binding.
// Estos helpers convierten los valores crudos de <input type="date"> /
// <input type="datetime-local"> (que no traen offset) a ese formato,
// usando la zona horaria del navegador.

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

function toZonedIso(date: Date): string {
  const offsetMinutesTotal = -date.getTimezoneOffset();
  const sign = offsetMinutesTotal >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutesTotal);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${offH}:${offM}`;
}

// "2026-07-13T10:00" (valor de <input type="datetime-local">) → ISO con offset
export function datetimeLocalToZonedIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return toZonedIso(date);
}

// "2026-07-13" (valor de <input type="date">) → inicio/fin de ese día, con offset
export function dateToZonedIsoStart(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (isNaN(date.getTime())) return undefined;
  return toZonedIso(date);
}

export function dateToZonedIsoEnd(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59`);
  if (isNaN(date.getTime())) return undefined;
  return toZonedIso(date);
}
