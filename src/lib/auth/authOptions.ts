// lib/auth/authOptions.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { authService } from './authService';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string; // opcional si backend rota cookie
}

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/** Util: parsear errores de fetch (json o text) */
async function parseResponseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.message) return String(data.message);
    if (data?.error) return String(data.error);
    return JSON.stringify(data);
  } catch {
    try { return await response.text(); } catch { /* fallback */ }
  }
  return `Error ${response.status} ${response.statusText}`;
}

/** parse JWT payload (unverified) - universal */
function 
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials-sync',
      name: 'Credentials Sync',
      credentials: {
        accessToken: { label: 'Access Token', type: 'text' },
        identifier: { label: 'Identifier', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken) {
          return null;
        }

        try {
          // Decodificar el accessToken que ya obtuvimos del backend
          const payload = parseJwt(credentials.accessToken);

          if (!payload) {
            return null;
          }

          // Return a "user" object to NextAuth
          return {
            id: payload.userId?.toString(),
            email: payload.sub,
            role: payload.scope,
            accessToken: credentials.accessToken,
          } as any;
        } catch (e) {
          console.error('authorize error', e);
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 days

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, save user data and accessToken
      if (user) {
        const expSec = parseJwt(user.accessToken)?.exp;
        const expMs = expSec ? expSec * 1000 : Date.now() + 15 * 60 * 1000;
        return {
          ...token,
          accessToken: user.accessToken,
          userId: user.id,
          role: user.role,
          accessTokenExpires: expMs,
        };
      }

      // If token not expired, return it
      if (Date.now() < (token.accessTokenExpires as number)) {
        console.log('✅ Access token valid, expires in: ' + token.accessTokenExpires);
        return token;
      }
      console.log('⏳ Access token expired, refreshing...');

      // Access token expired -> refresh using cookie-based refresh endpoint
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId as string,
          role: token.role as string,
          email: token.email as string,
        } as any;
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    // signOut: '/logout',
    error: '/login', // NextAuth redirects here on errors
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
};

/**
 * Refresca el access token usando la cookie HttpOnly
 * El navegador envía automáticamente la cookie al backend
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    console.log('🔄 Calling refresh endpoint...');
    
    // La cookie HttpOnly se envía automáticamente con credentials: 'include'
    const refreshed = await authService.refresh();

    // Decodificar nuevo token
    const payload = parseJwt(refreshed.accessToken);
    
    console.log('✅ Token refreshed successfully');

    return {
      ...token,
      accessToken: refreshed.accessToken,
      accessTokenExpires: payload?.exp ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000,
    };
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}