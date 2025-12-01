'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  // Normalizar el rol (quitar ROLE_)
  const rawRole = session?.user?.role || null;
  const role = rawRole?.startsWith("ROLE_")
    ? rawRole.replace("ROLE_", "")
    : rawRole;

  useEffect(() => {
    if (requireAuth && !loading && !session) {
      router.push('/login');
    }
  }, [session, loading, requireAuth, router]);

  return {
    session,
    user: session?.user,
    role,
    loading,
    isAuthenticated: !!session,
    isAdvertiser: role === 'ADVERTISER',
    isConsumer: role === 'CONSUMER',
    isSeller: role === 'SELLER',
    isAdmin: role === 'ADMIN',
  };
}

export function useRequireRole(allowedRoles: string[]) {
  const { session, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      if (role && !allowedRoles.includes(role)) {
        router.push('/unauthorized');
      }
    }
  }, [session, loading, role, allowedRoles, router]);

  return { session, loading };
}
