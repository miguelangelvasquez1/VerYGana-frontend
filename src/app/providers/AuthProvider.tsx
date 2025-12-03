'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth/authService';  // Ajusta el path
import { useRouter } from 'next/navigation';
import { parseJwt } from '@/lib/utils/parseJwt';

// Canal para broadcast entre pestañas (evita race conditions)
const broadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('auth-channel') : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);  // Lock para evitar race en refresh
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || isRefreshing) return;

    if (session?.error === 'RefreshAccessTokenError') {
      console.log('🔄 Client-side refresh triggered due to expired token');
      handleClientRefresh();
    }
  }, [session, status, isRefreshing]);

  // Escuchar broadcasts de otras pestañas
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = async (event: MessageEvent) => {
      const { type, data } = event.data;

      if (type === 'token-refreshed') {
        console.log('📡 Received refreshed token from another tab');
        // Sincroniza con NextAuth
        const result = await signIn('credentials-sync', {
          redirect: false,
          accessToken: data.accessToken,
          identifier: data.identifier,  // Asegúrate de enviar el identifier correcto
        });

        if (!result?.error) {
          await update({ accessToken: data.accessToken });
          console.log('✅ Session synced from broadcast');
        }
      } else if (type === 'logout') {
        console.log('📡 Received logout signal from another tab');
        await signOut({ redirect: false });
        router.push('/login');
      } else if (type === 'refresh-start') {
        setRefreshLock(true);  // Bloquea refresh en esta pestaña
      } else if (type === 'refresh-end') {
        setRefreshLock(false);  // Libera lock
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => broadcastChannel.removeEventListener('message', handleMessage);
  }, [router]);

  const handleClientRefresh = async () => {
    if (refreshLock) {
      console.log('🔒 Refresh locked by another tab, waiting...');
      return;
    }

    setIsRefreshing(true);
    // Broadcast que inicia refresh (lock para otras pestañas)
    broadcastChannel?.postMessage({ type: 'refresh-start' });

    try {
      const refreshed = await authService.refresh();  // Llama refresh (envía cookie)
      const payload = parseJwt(refreshed.accessToken);  // Asegúrate de tener parseJwt

      // Sincroniza con NextAuth
      const result = await signIn('credentials-sync', {
        redirect: false,
        accessToken: refreshed.accessToken,
        identifier: payload.sub,  // O el identifier que uses
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      await update({ accessToken: refreshed.accessToken });

      console.log('✅ Session refreshed and synced');

      // Broadcast el nuevo token a otras pestañas
      broadcastChannel?.postMessage({
        type: 'token-refreshed',
        data: {
          accessToken: refreshed.accessToken,
          identifier: payload.sub,
        },
      });
    } catch (error) {
      console.error('❌ Client refresh failed:', error);
      // Si falla, logout en todas las pestañas
      broadcastChannel?.postMessage({ type: 'logout' });
      await signOut({ redirect: false });
      router.push('/login');
    } finally {
      setIsRefreshing(false);
      // Libera lock
      broadcastChannel?.postMessage({ type: 'refresh-end' });
    }
  };

  return <>{children}</>;
}