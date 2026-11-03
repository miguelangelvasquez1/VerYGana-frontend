import { describe, expect, it } from 'vitest';
import { FOCUSABLE_SELECTOR, isTabbable, trappedFocusIndex } from '@/lib/a11y/focusTrap';

describe('trappedFocusIndex', () => {
  it('sin enfocables, el foco se queda en el panel', () => {
    expect(trappedFocusIndex({ index: -1, count: 0, shiftKey: false })).toBe('panel');
    expect(trappedFocusIndex({ index: -1, count: 0, shiftKey: true })).toBe('panel');
  });

  it('Tab en el último vuelve al primero', () => {
    expect(trappedFocusIndex({ index: 3, count: 4, shiftKey: false })).toBe(0);
  });

  it('Mayús+Tab en el primero va al último', () => {
    expect(trappedFocusIndex({ index: 0, count: 4, shiftKey: true })).toBe(3);
  });

  it('con el foco en el panel (index -1)', () => {
    expect(trappedFocusIndex({ index: -1, count: 4, shiftKey: true })).toBe(3);
    expect(trappedFocusIndex({ index: -1, count: 4, shiftKey: false })).toBe(0);
  });

  it('en un elemento del medio no interviene', () => {
    expect(trappedFocusIndex({ index: 1, count: 4, shiftKey: false })).toBeNull();
    expect(trappedFocusIndex({ index: 2, count: 4, shiftKey: true })).toBeNull();
  });

  it('con un solo enfocable, Tab y Mayús+Tab se quedan en él', () => {
    expect(trappedFocusIndex({ index: 0, count: 1, shiftKey: false })).toBe(0);
    expect(trappedFocusIndex({ index: 0, count: 1, shiftKey: true })).toBe(0);
  });

  it('un índice fuera de rango (el foco salió del panel) vuelve adentro', () => {
    expect(trappedFocusIndex({ index: 9, count: 4, shiftKey: false })).toBe(0);
    expect(trappedFocusIndex({ index: 9, count: 4, shiftKey: true })).toBe(3);
    expect(trappedFocusIndex({ index: -5, count: 4, shiftKey: false })).toBe(0);
  });
});

describe('isTabbable (S4)', () => {
  const el = (rects: number, hiddenAncestor: boolean) => ({
    getClientRects: () => ({ length: rects }),
    closest: (selector: string) => (hiddenAncestor && selector === '[hidden]' ? {} : null),
  });

  it('un elemento visible entra en el ciclo', () => {
    expect(isTabbable(el(1, false))).toBe(true);
  });

  it('uno sin caja (display: none) no entra', () => {
    expect(isTabbable(el(0, false))).toBe(false);
  });

  it('uno dentro de un ancestro [hidden] no entra', () => {
    expect(isTabbable(el(1, true))).toBe(false);
  });

  it('el selector excluye input hidden y enlaces con tabindex -1', () => {
    expect(FOCUSABLE_SELECTOR).toContain('input:not([disabled]):not([type="hidden"])');
    expect(FOCUSABLE_SELECTOR).toContain('a[href]:not([tabindex="-1"])');
  });
});
