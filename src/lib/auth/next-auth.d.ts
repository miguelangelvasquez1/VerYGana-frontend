import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      /** UUID del usuario — el backend ya no expone el id interno en el token. */
      publicId: string;
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
    publicId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    publicId: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}