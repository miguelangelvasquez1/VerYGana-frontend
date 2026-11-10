interface LikeEligibility {
  hasReachedEnd: boolean;
  hasLiked: boolean;
  requestStarted: boolean;
}

export function shouldSubmitAdLike({
  hasReachedEnd,
  hasLiked,
  requestStarted,
}: LikeEligibility): boolean {
  return hasReachedEnd && hasLiked && !requestStarted;
}
