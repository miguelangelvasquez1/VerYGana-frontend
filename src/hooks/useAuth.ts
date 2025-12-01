// ============================================
// hooks/useAuth.ts
// Hook personalizado para autenticación
// ============================================
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  useEffect(() => {
    if (requireAuth && !loading && !session) {
      router.push('/login');
    }
  }, [session, loading, requireAuth, router]);

  return {
    session,
    user: session?.user,
    loading,
    isAuthenticated: !!session,
    isAdvertiser: session?.user?.role === 'ADVERTISER',
    isConsumer: session?.user?.role === 'CONSUMER',
    isSeller: session?.user?.role === 'SELLER',
  };
}

// Hook para requerir role específico
export function useRequireRole(allowedRoles: string[]) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      const userRole = session.user?.role;
      if (userRole && !allowedRoles.includes(userRole)) {
        router.push('/unauthorized');
      }
    }
  }, [session, loading, allowedRoles, router]);

  return { session, loading };
}