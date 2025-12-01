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

export interface RegisterAdvertiserData {
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

  // Login directo para guardar refresh token en cookie HttpOnly
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error al iniciar sesión');
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
      credentials: 'include', // ✅ Envía cookie automáticamente
    });

    if (!response.ok) {
      throw new Error('Error al refrescar token');
    }

    return response.json();
  },

  // Registro de Consumer
  async registerConsumer(data: RegisterConsumerData) {
    const response = await fetch(`${API_URL}/auth/register/consumer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar');
    }

    return response.json();
  },

  // Registro de Advertiser
  async registerAdvertiser(data: RegisterAdvertiserData) {
    const response = await fetch(`${API_URL}/auth/register/advertiser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar');
    }

    return response.json();
  },

  // Verificar si hay sesión activa
  async checkSession() {
    // NextAuth maneja esto automáticamente con useSession
    return true;
  },
  
  /**
   * Logout: revoca token en backend y limpia cookie
   */
  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // ✅ Envía cookie para revocación
    });
  },
};
