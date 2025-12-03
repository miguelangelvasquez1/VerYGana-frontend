export function 
parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof window === 'undefined') {
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } else {
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
  } catch (e) {
    console.error('parseJwt error', e);
    return null;
  }
}