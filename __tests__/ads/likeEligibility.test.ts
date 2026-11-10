import { describe, expect, it } from 'vitest';
import { shouldSubmitAdLike } from '@/lib/ads/likeEligibility';

describe('shouldSubmitAdLike', () => {
  it('waits for playback to finish even when the user has already liked', () => {
    expect(
      shouldSubmitAdLike({ hasReachedEnd: false, hasLiked: true, requestStarted: false }),
    ).toBe(false);
  });

  it('submits after playback ends if the user has liked', () => {
    expect(
      shouldSubmitAdLike({ hasReachedEnd: true, hasLiked: true, requestStarted: false }),
    ).toBe(true);
  });

  it('does not submit without a like or while a request is in flight', () => {
    expect(
      shouldSubmitAdLike({ hasReachedEnd: true, hasLiked: false, requestStarted: false }),
    ).toBe(false);
    expect(
      shouldSubmitAdLike({ hasReachedEnd: true, hasLiked: true, requestStarted: true }),
    ).toBe(false);
  });
});
