import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
    error?: string;
  }

  interface User extends DefaultUser {
    role: string;
    accessToken: string;
    refreshToken: string;
    userId: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}