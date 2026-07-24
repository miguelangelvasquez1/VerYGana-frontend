import apiClient from "@/lib/api/client";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: 'CONSUMER' | 'COMMERCIAL';
  };
}

/**
 * Login general (funciona para todos los roles)
 */
export const loginUser = async (
  identifier: string,
  password: string
): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
};

/**
 * Logout
 */
export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  // Limpiar token del localStorage
  localStorage.removeItem('authToken');
};

/**
 * Verificar token
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    await apiClient.get('/auth/verify');
    return true;
  } catch {
    return false;
  }
};

/**
 * Verificar email con código OTP
 */
export const verifyEmail = async (email: string, code: string): Promise<void> => {
  await apiClient.post('/auth/verify-email', { email, code });
};

/**
 * Reenviar código de verificación por correo
 */
export const resendEmailVerification = async (email: string): Promise<void> => {
  await apiClient.post('/auth/resend-verification', { email });
};

/**
 * Enviar OTP por SMS al teléfono registrado
 */
export const sendPhoneVerification = async (email: string): Promise<void> => {
  await apiClient.post('/auth/send-phone-verification', { email });
};

/**
 * Verificar código OTP de SMS
 */
export const verifyPhone = async (email: string, code: string): Promise<void> => {
  await apiClient.post('/auth/verify-phone', { email, code });
};

/**
 * Solicitar código de recuperación de contraseña
 * Siempre devuelve 200, exista o no el correo (anti-enumeración)
 */
export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post('/auth/forgot-password', { email });
};

/**
 * Confirmar código y establecer nueva contraseña
 */
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  await apiClient.post('/auth/reset-password', { email, code, newPassword });
};