import { describe, expect, it } from 'vitest';
import { formatBogotaDateTime, formatPlainDate, todayInBogota } from '@/lib/utils/dateDisplay';

describe('formatPlainDate', () => {
  it('no se corre un día por la zona horaria', () => {
    const prev = process.env.TZ;
    process.env.TZ = 'America/Bogota';
    try {
      expect(formatPlainDate('2026-10-01')).toBe('1 de octubre de 2026');
    } finally {
      if (prev === undefined) delete process.env.TZ;
      else process.env.TZ = prev;
    }
    expect(formatPlainDate('2026-01-31')).toBe('31 de enero de 2026');
  });
  it('fecha inválida o vacía', () => {
    expect(formatPlainDate('2026-02-30')).toBe('—');
    expect(formatPlainDate('')).toBe('—');
    expect(formatPlainDate(null)).toBe('—');
  });
});

describe('todayInBogota', () => {
  it('usa el día de Colombia, no el de UTC', () => {
    expect(todayInBogota(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-27');
    expect(todayInBogota(new Date('2026-10-27T15:00:00Z'))).toBe('2026-10-27');
  });
});

describe('formatBogotaDateTime', () => {
  it('muestra la hora de Colombia', () => {
    const text = formatBogotaDateTime('2026-10-28T03:00:00Z');
    expect(text).toContain('27');
    expect(text).not.toContain('28');
    expect(text).toMatch(/10:00/);
    expect(text.toLowerCase().replace(/[.\s  ]/g, '')).toContain('pm');
  });
  it('vacío', () => {
    expect(formatBogotaDateTime('')).toBe('—');
  });
});
