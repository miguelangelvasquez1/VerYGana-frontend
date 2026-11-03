import { describe, expect, it } from 'vitest';
import { REFUSAL_REASON_MAX, refusalReasonSchema } from '@/lib/formalization/refusalReasonSchema';

describe('refusalReasonSchema (CA-5, CA-7)', () => {
  it('el motivo es opcional', () => {
    expect(refusalReasonSchema.safeParse({ reason: '' }).success).toBe(true);
  });
  it('1000 caracteres sí, 1001 no', () => {
    expect(refusalReasonSchema.safeParse({ reason: 'a'.repeat(1000) }).success).toBe(true);
    const result = refusalReasonSchema.safeParse({ reason: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Máximo 1000 caracteres');
      expect(result.error.issues[0].path).toEqual(['reason']);
    }
  });
  it('no recorta (lo hace confirmRefusal)', () => {
    expect(refusalReasonSchema.safeParse({ reason: '  motivo  ' }).success).toBe(true);
  });
  it('REFUSAL_REASON_MAX', () => {
    expect(REFUSAL_REASON_MAX).toBe(1000);
  });
});
