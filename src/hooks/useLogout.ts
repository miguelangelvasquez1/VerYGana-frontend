import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/services/AuthService';
import toast from 'react-hot-toast';

export const useLogout = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const logout = async () => {
    try {
      // 1. Llamar al backend para invalidar refresh token (cookie httpOnly)
      if (session) {
        await logoutUser();
      }

      // 2. Cerrar sesión en NextAuth (limpia todo)
      await signOut({
        redirect: false,     // Evitamos redirección automática
      });

      // 3. Notificación
      toast.success("Sesión cerrada correctamente");

      // 4. Redirigir al login
      router.push('/login');
      router.refresh(); // Opcional: fuerza refresco de server components

    } catch (error) {
      console.error("Error durante logout:", error);
      
      // Logout forzado en frontend aunque falle el backend
      await signOut({ redirect: false });
      toast.error("Sesión cerrada (error en servidor)");
      router.push('/login');
    }
  };

  return { logout };
};