// Pesos (texto que escribe la persona) <-> centavos (lo que habla la API).
// La aritmética es sobre la cadena: `1234.56 * 100` da 123455.99999999999 en coma flotante.

export type PesosParseResult =
  | { kind: 'valid'; value: number; decimals: number }
  | { kind: 'negative' }
  | { kind: 'invalid' };

// Un solo separador decimal (coma o punto), sin separador de miles.
const AMOUNT_RE = /^(-?)(\d+)(?:[.,](\d+))?$/;

export function parsePesosInput(text: string): PesosParseResult {
  const match = AMOUNT_RE.exec(text.trim());
  if (!match) return { kind: 'invalid' };
  const [, sign, intPart, fracPart = ''] = match;
  const value = Number(`${intPart}.${fracPart || '0'}`);
  if (sign === '-' && value !== 0) return { kind: 'negative' };
  return { kind: 'valid', value, decimals: fracPart.length };
}

// Pesos a centavos enteros, redondeando al centavo más cercano (0,005 -> 1).
// `null` si el texto no es un monto válido o es negativo.
export function pesosToCents(text: string): number | null {
  const match = AMOUNT_RE.exec(text.trim());
  if (!match) return null;
  const [, sign, intPart, fracPart = ''] = match;
  const padded = `${fracPart}000`;
  let cents = Number(intPart) * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) cents += 1;
  if (sign === '-' && cents !== 0) return null;
  return cents;
}

// Centavos a texto editable en pesos, con coma decimal y sin ceros sobrantes.
export function centsToPesosInput(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const rest = Math.abs(cents % 100);
  if (rest === 0) return String(whole);
  const frac = String(rest).padStart(2, '0').replace(/0$/, '');
  return `${whole},${frac}`;
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return copFormatter.format(cents / 100);
}
