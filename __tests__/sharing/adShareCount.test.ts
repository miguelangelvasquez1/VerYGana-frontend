import { describe, expect, it } from 'vitest';
import { getAdShareCount, incrementAdShareCount } from '@/lib/sharing/adShareCount';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

describe('ad share count persistence', () => {
  it('stores the count separately for each ad and reads it back', () => {
    const storage = createStorage();

    expect(incrementAdShareCount(storage, 15)).toBe(1);
    expect(incrementAdShareCount(storage, 15)).toBe(2);
    expect(incrementAdShareCount(storage, 16)).toBe(1);
    expect(getAdShareCount(storage, 15)).toBe(2);
  });

  it('treats missing or invalid values as zero', () => {
    const storage = createStorage();
    storage.setItem('ad-share-count:15', 'invalid');

    expect(getAdShareCount(storage, 15)).toBe(0);
  });
});
