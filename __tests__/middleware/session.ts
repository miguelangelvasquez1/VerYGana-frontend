import { encode } from 'next-auth/jwt';

/** Secreto ficticio: solo existe en las pruebas. */
export const TEST_SECRET = 'secreto-ficticio-solo-para-pruebas-0123456789';

/** Nombre de la cookie de sesión de next-auth v4 cuando NEXTAUTH_URL no es https. */
const COOKIE_NAME = 'next-auth.session-token';

/** Devuelve la cabecera `Cookie` con una sesión firmada con el secreto ficticio y el rol dado. */
export async function sessionCookie(role: string): Promise<string> {
  const token = await encode({
    // Los campos extra existen porque el tipo JWT de la app los exige; todos son ficticios.
    token: {
      sub: 'usuario-ficticio',
      role,
      publicId: 'id-ficticio',
      accessToken: 'access-ficticio',
      refreshToken: 'refresh-ficticio',
      accessTokenExpires: 0,
    },
    secret: TEST_SECRET,
  });
  return `${COOKIE_NAME}=${token}`;
}
