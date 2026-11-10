import { describe, expect, it, vi } from 'vitest';
import { shareOnce } from '@/lib/sharing/shareOnce';

describe('shareOnce', () => {
  it('does not start another native share while the first one is pending', async () => {
    let finishFirstShare: (() => void) | undefined;
    const nativeShare = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishFirstShare = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const firstShare = shareOnce(nativeShare);
    const secondShare = await shareOnce(nativeShare);

    expect(secondShare).toBe(false);
    expect(nativeShare).toHaveBeenCalledOnce();

    finishFirstShare?.();
    await expect(firstShare).resolves.toBe(true);
    await expect(shareOnce(nativeShare)).resolves.toBe(true);
    expect(nativeShare).toHaveBeenCalledTimes(2);
  });
});
