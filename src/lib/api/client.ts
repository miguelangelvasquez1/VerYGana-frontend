import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession(); // NextAuth puede refrescar aquí si es necesario
  const token = (session as any)?.accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use((response) => response, async (error) => {

    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    /*
     * FEATURE FLAGS / MANTENIMIENTO
     */
    if (status === 503 && canShow503Toast()) {

      toast(message || "El servicio no está disponible temporalmente. Por favor, inténtalo de nuevo más tarde.");
    }

    /*
     * TOKEN EXPIRADO / SESIÓN INVÁLIDA
     */
    if (status === 401) {
      await handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default apiClient;

async function handleUnauthorized() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.error('Error during signOut after 401:', error);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/*
 * Evita spam de toasts cuando varias requests
 * fallan al mismo tiempo
 */
let last503Toast = 0;

function canShow503Toast(): boolean {
  const now = Date.now();

  if (now - last503Toast < 5000) {
    return false;
  }

  last503Toast = now;

  return true;
}
