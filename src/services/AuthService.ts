import api from '../lib/axios';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: 'CONSUMER' | 'SELLER' | 'ADVERTISER';
  };
}

/**
 * Login general (funciona para todos los roles)
 */
export const loginUser = async (
  identifier: string, 
  password: string
): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
};

/**
 * Logout
 */
export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
  // Limpiar token del localStorage
  localStorage.removeItem('authToken');
};

/**
 * Verificar token
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    await api.get('/auth/verify');
    return true;
  } catch {
    return false;
  }
};

/**
 * Recuperar contraseña
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post('/auth/password-reset/request', { email });
};

/**
 * Cambiar contraseña
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post('/auth/password-reset/confirm', {
    token,
    newPassword
  });
};