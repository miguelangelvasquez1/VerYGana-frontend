import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Crear instancia de axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request - Agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response - Manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => {
    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.url}`, response.status);
    }
    return response;
  },
  (error: AxiosError) => {
    // Manejo de errores específicos
    if (error.response) {
      const status = error.response.status;
      const errorMessage = (error.response.data as any)?.message || 'Error desconocido';

      switch (status) {
        case 401:
          // No autorizado - Token inválido o expirado
          console.error('❌ 401: No autorizado');
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            // Redirigir a login si no está en páginas públicas
            const publicPaths = ['/login', '/register', '/'];
            const currentPath = window.location.pathname;
            
            if (!publicPaths.includes(currentPath)) {
              window.location.href = '/login?expired=true';
            }
          }
          break;

        case 403:
          // Prohibido - Sin permisos
          console.error('❌ 403: Acceso prohibido');
          break;

        case 404:
          // No encontrado
          console.error('❌ 404: Recurso no encontrado');
          break;

        case 422:
          // Error de validación
          console.error('❌ 422: Error de validación', errorMessage);
          break;

        case 500:
          // Error del servidor
          console.error('❌ 500: Error del servidor');
          break;

        default:
          console.error(`❌ Error ${status}:`, errorMessage);
      }

      // Retornar error con información estructurada
      return Promise.reject({
        status,
        message: errorMessage,
        data: error.response.data
      });
    } else if (error.request) {
      // Request hecho pero sin respuesta
      console.error('❌ Sin respuesta del servidor');
      return Promise.reject({
        status: 0,
        message: 'No se pudo conectar con el servidor',
        data: null
      });
    } else {
      // Error al configurar el request
      console.error('❌ Error de configuración:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message,
        data: null
      });
    }
  }
);

// Helpers para diferentes tipos de requests

/**
 * GET request helper con tipos
 */
export async function get<T>(url: string, config?: AxiosRequestConfig) {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * POST request helper con tipos
 */
export async function post<T, D = any>(
  url: string, 
  data?: D, 
  config?: AxiosRequestConfig
) {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * PUT request helper con tipos
 */
export async function put<T, D = any>(
  url: string, 
  data?: D, 
  config?: AxiosRequestConfig
) {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * DELETE request helper con tipos
 */
export async function del<T>(url: string, config?: AxiosRequestConfig) {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

/**
 * PATCH request helper con tipos
 */
export async function patch<T, D = any>(
  url: string, 
  data?: D, 
  config?: AxiosRequestConfig
) {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

// Función para actualizar el token
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

// Función para limpiar autenticación
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Función para obtener el token actual
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

// Función para verificar si está autenticado
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export default apiClient;