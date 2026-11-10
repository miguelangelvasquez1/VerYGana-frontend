const AD_SHARE_COUNT_KEY = 'ad-share-count';

type ShareCountStorage = Pick<Storage, 'getItem' | 'setItem'>;

function getStorageKey(adId: number): string {
  return `${AD_SHARE_COUNT_KEY}:${adId}`;
}

export function getAdShareCount(storage: ShareCountStorage, adId: number): number {
  const savedCount = Number(storage.getItem(getStorageKey(adId)));
  return Number.isSafeInteger(savedCount) && savedCount > 0 ? savedCount : 0;
}

export function incrementAdShareCount(storage: ShareCountStorage, adId: number): number {
  const nextCount = getAdShareCount(storage, adId) + 1;
  storage.setItem(getStorageKey(adId), String(nextCount));
  return nextCount;
}
