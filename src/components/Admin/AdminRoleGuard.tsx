'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { getRoleHomePath } from '@/lib/auth/roleRedirect';

const normalizeRole = (role?: string | null) =>
  role ? `ROLE_${String(role).replace(/^ROLE_/, '').toUpperCase()}` : null;

// Guard de rol ADMIN para todas las rutas /admin (el middleware no cubre
// /admin). Sin sesión -> /login; con otro rol -> al panel de su rol.
export function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = normalizeRole(session?.user?.role);
  const allowed = status === 'authenticated' && role === 'ROLE_ADMIN';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (role !== 'ROLE_ADMIN') {
      router.replace(getRoleHomePath(role) ?? '/login');
    }
  }, [status, role, router]);

  if (!allowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-admin-blue" />
      </div>
    );
  }

  return <>{children}</>;
}
