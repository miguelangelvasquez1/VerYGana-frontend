import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

import apiClient from '@/lib/api/client';
import { OnboardingService } from '@/services/commercial/OnboardingService';

const post = vi.mocked(apiClient.post);

beforeEach(() => vi.clearAllMocks());

describe('OnboardingService.approveContract', () => {
  it('manda el cuerpo y la Idempotency-Key', async () => {
    const data = { contractId: 7 };
    post.mockResolvedValue({ data });
    const body = { declarationVersion: '1.0', decision: 'REFUSE', refusalReason: 'x' } as const;
    await expect(OnboardingService.approveContract(body, 'k-1')).resolves.toBe(data);
    expect(post).toHaveBeenCalledWith('/commercials/onboarding/contract/approve', body, {
      headers: { 'Idempotency-Key': 'k-1' },
    });
  });

  it('con {} manda {} y la cabecera', async () => {
    post.mockResolvedValue({ data: {} });
    await OnboardingService.approveContract({}, 'k-2');
    expect(post).toHaveBeenCalledWith('/commercials/onboarding/contract/approve', {}, {
      headers: { 'Idempotency-Key': 'k-2' },
    });
  });
});
