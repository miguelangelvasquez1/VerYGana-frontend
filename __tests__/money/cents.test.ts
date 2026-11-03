import { describe, expect, it } from 'vitest';
import { centsToPesosInput, formatCents, parsePesosInput, pesosToCents } from '@/lib/money/cents';

describe('parsePesosInput', () => {
  it('acepta coma o punto como separador decimal', () => {
    expect(parsePesosInput('1234,56')).toMatchObject({ kind: 'valid', value: 1234.56 });
    expect(parsePesosInput('1234.56')).toMatchObject({ kind: 'valid', value: 1234.56 });
  });
  it('detecta negativos', () => {
    expect(parsePesosInput('-5').kind).toBe('negative');
  });
  it('rechaza lo que no es un monto', () => {
    for (const text of ['abc', '', '1,2,3', '1.500.000', '  ']) {
      expect(parsePesosInput(text).kind).toBe('invalid');
    }
  });
  it('informa cuántos decimales trae', () => {
    expect(parsePesosInput('1234,567')).toMatchObject({ kind: 'valid', decimals: 3 });
    expect(parsePesosInput('1234,56')).toMatchObject({ kind: 'valid', decimals: 2 });
    expect(parsePesosInput('1500')).toMatchObject({ kind: 'valid', decimals: 0 });
  });
});

describe('pesosToCents', () => {
  it('no pierde un centavo por coma flotante', () => {
    expect(pesosToCents('1234,56')).toBe(123456);
    expect(pesosToCents('1234.56')).toBe(123456);
  });
  it('redondea al centavo más cercano', () => {
    expect(pesosToCents('0,005')).toBe(1);
    expect(pesosToCents('0,004')).toBe(0);
  });
  it('enteros', () => {
    expect(pesosToCents('0')).toBe(0);
    expect(pesosToCents('1500000')).toBe(150000000);
  });
  it('devuelve null si el texto no es un monto válido o es negativo', () => {
    expect(pesosToCents('-5')).toBeNull();
    expect(pesosToCents('abc')).toBeNull();
    expect(pesosToCents('')).toBeNull();
  });
});

describe('centsToPesosInput', () => {
  it('centavos a texto con coma decimal', () => {
    expect(centsToPesosInput(123456)).toBe('1234,56');
    expect(centsToPesosInput(150000000)).toBe('1500000');
    expect(centsToPesosInput(5)).toBe('0,05');
    expect(centsToPesosInput(0)).toBe('0');
    expect(centsToPesosInput(120)).toBe('1,2');
  });
});

describe('formatCents', () => {
  const norm = (s: string) => s.replace(/ /g, ' ');
  it('formatea en COP con separador de miles', () => {
    expect(norm(formatCents(123456))).toContain('1.234,56');
    expect(norm(formatCents(150000000))).toContain('1.500.000');
  });
});
