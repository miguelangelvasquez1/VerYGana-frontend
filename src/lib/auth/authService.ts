// ============================================
// lib/auth/authService.ts
// Servicios de autenticación
// ============================================
export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  role: 'ROLE_CONSUMER' | 'ROLE_COMMERCIAL' | 'ROLE_ADMIN';
}

export interface RegisterConsumerData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  preferences: number[];
}

export interface RegisterCommercialData {
  username: string;
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phoneNumber: string;
  businessType: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const authService = {

  // Login directo para guardar refresh token en cookie HttpOnly cliente
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const customError = new Error(error.message || 'Error al iniciar sesión');
      (customError as any).status = response.status;
      throw customError;
    }

    return response.json();
  },

   /**
   * Refresh usando la cookie HttpOnly
   * El navegador envía automáticamente la cookie
   */
  async refresh(): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al refrescar token');
    }
    console.log('Refresh successful');
    return response.json();
  },

  // Verificar si hay sesión activa
  async checkSession() {
    // NextAuth maneja esto automáticamente con useSession
    return true;
  },
};
