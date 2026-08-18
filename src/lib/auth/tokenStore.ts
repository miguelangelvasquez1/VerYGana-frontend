// In-memory access-token cache for the browser, kept in sync with NextAuth's
// session by <AuthProvider> (see app/providers/AuthProvider.tsx). This lets
// the axios interceptor in lib/api/client.ts read the token synchronously
// instead of calling getSession() (an HTTP round-trip to /api/auth/session)
// on every single request.
//
// Server-side (Server Components doing their own data fetching) never runs
// AuthProvider's effect, so this store is browser-only by design — the
// interceptor falls back to getSession() there instead of reading this.

let currentToken: string | null = null;
let isReady = false;
let resolveReady: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => { resolveReady = resolve; });

const subscribers = new Set<(token: string | null) => void>();

export function setAccessToken(token: string | null): void {
  const changed = currentToken !== token;
  currentToken = token;
  if (!isReady) {
    isReady = true;
    resolveReady?.();
  }
  if (changed) subscribers.forEach((fn) => fn(token));
}

/**
 * Notifies on every token change (login, refresh, logout).
 *
 * Used by the pet game: it runs in a cross-origin iframe and grabs its JWT once
 * at startup, so it never sees later refreshes. The host page has to push the
 * new token in, and this is how it finds out there is one.
 *
 * Returns the unsubscribe function.
 */
export function onAccessTokenChange(fn: (token: string | null) => void): () => void {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

export function getAccessToken(): string | null {
  return currentToken;
}

/**
 * Resolves once the token store has synced at least once with NextAuth's
 * session (login, logout, or "no session"). Awaiting this before the very
 * first request avoids a race where a request fires before AuthProvider's
 * effect has run and gets sent without a token it actually has.
 * Resolves instantly after the first sync — this is not a per-request cost.
 */
export function whenTokenReady(): Promise<void> {
  return isReady ? Promise.resolve() : readyPromise;
}
