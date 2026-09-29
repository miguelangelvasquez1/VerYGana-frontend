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

export class AccountPendingReviewError extends Error {
  constructor() {
    super('ACCOUNT_PENDING_REVIEW');
    this.name = 'AccountPendingReviewError';
  }
}

export class AccountLockedError extends Error {
  identifier: string;
  constructor(message: string, identifier: string) {
    super(message);
    this.name = 'AccountLockedError';
    this.identifier = identifier;
  }
}

// 403 — PendingEmailVerificationException: el correo aún no está verificado
export class EmailVerificationPendingError extends Error {
  constructor(message?: string) {
    super(message || 'Debes verificar tu correo electrónico antes de iniciar sesión.');
    this.name = 'EmailVerificationPendingError';
  }
}

// 409 — PendingKycReviewException: la cuenta está en revisión de cumplimiento
export class KycReviewPendingError extends Error {
  constructor(message?: string) {
    super(message || 'Tu cuenta está en revisión de cumplimiento.');
    this.name = 'KycReviewPendingError';
  }
}

// 428 — PasswordNotConfiguredException: falta completar el setup de contraseña
export class PasswordSetupRequiredError extends Error {
  constructor(message?: string) {
    super(message || 'Debes completar la configuración de tu contraseña.');
    this.name = 'PasswordSetupRequiredError';
  }
}

// MP-38 § 5.2-5.4 — Intento de registro/login de menor de edad confirmado.
// El bloqueo es estructural: no admite excepción por autorización parental.
export class UnderageUserError extends Error {
  constructor(message?: string) {
    super(message || 'Debes ser mayor de 18 años para usar Ver y Gana.');
    this.name = 'UnderageUserError';
  }
}

// MP-38 § 5.7 — Posible duplicidad detectada; NO implica fraude confirmado.
// La cuenta queda en PREVENTIVELY_RESTRICTED mientras se revisa.
export class PossibleDuplicityError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Detectamos una posible coincidencia con otra cuenta. ' +
        'Tu solicitud está en revisión; te notificaremos pronto.'
    );
    this.name = 'PossibleDuplicityError';
  }
}

// MP-38 § 5.7 — Duplicidad confirmada como fraude: registro rechazado.
export class DuplicateAccountError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'No es posible crear una segunda cuenta. ' +
        'Cada persona natural puede tener una sola cuenta en Ver y Gana.'
    );
    this.name = 'DuplicateAccountError';
  }
}

// MP-38 § 5.4 / 5.8 — Cuenta terminada (incluye terminación por minoría de edad).
// Se preservan PQR, garantías y obligaciones de datos personales.
export class AccountTerminatedError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Esta cuenta ha sido terminada. Si tienes reclamaciones o garantías ' +
        'pendientes, comunícate con nuestro equipo de soporte.'
    );
    this.name = 'AccountTerminatedError';
  }
}

// El backend a veces responde JSON ({ message: "..." }) y a veces texto plano
// ("Cuenta desbloqueada...") en el mismo endpoint — soportamos ambos formatos.
async function parseAuthBody(response: Response): Promise<{ message: string }> {
  const text = await response.text().catch(() => '');
  if (!text) return { message: '' };
  try {
    const data = JSON.parse(text);
    return { message: data?.message ?? text };
  } catch {
    return { message: text };
  }
}

export const authService = {

  // Login directo para guardar refresh token en cookie HttpOnly cliente
  async login(identifier: string, password: string, recaptchaToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password,recaptchaToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      if (response.status === 423) {
        throw new AccountLockedError(
          error.message || 'Cuenta bloqueada por múltiples intentos fallidos. Revisa tu correo para el código de desbloqueo.',
          identifier
        );
      }

      if (response.status === 403) {
        throw new EmailVerificationPendingError(error.message);
      }

      if (response.status === 409) {
        throw new KycReviewPendingError(error.message);
      }

      if (response.status === 428) {
        throw new PasswordSetupRequiredError(error.message);
      }

      // MP-38: estados de cuenta con errorCode explícito del back
      const errorCode: string = error.errorCode ?? error.code ?? '';

      if (errorCode === 'UNDERAGE_USER' || response.status === 451) {
        throw new UnderageUserError(error.message);
      }

      if (errorCode === 'POSSIBLE_DUPLICITY') {
        throw new PossibleDuplicityError(error.message);
      }

      if (errorCode === 'DUPLICATE_ACCOUNT' || errorCode === 'FRAUD_CONFIRMED') {
        throw new DuplicateAccountError(error.message);
      }

      if (
        errorCode === 'ACCOUNT_TERMINATED' ||
        error.message?.toLowerCase().includes('terminada') ||
        error.message?.toLowerCase().includes('terminated')
      ) {
        throw new AccountTerminatedError(error.message);
      }

      const isDisabled =
        response.status === 401 &&
        (error.type === 'DisabledException' ||
          error.exception?.includes('DisabledException') ||
          error.errorCode === 'ACCOUNT_DISABLED' ||
          error.message?.toLowerCase().includes('disabled'));
      if (isDisabled) throw new AccountPendingReviewError();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return response.json();
  },

  // Verificar el código de 6 dígitos enviado por correo y desbloquear la cuenta
  async unlockAccount(identifier: string, code: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/unlock-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });

    const body = await parseAuthBody(response);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No encontramos ninguna cuenta con ese correo o teléfono.');
      }
      throw new Error(body.message || 'El código ingresado no es válido.');
    }

    return body;
  },

  // Reenvía el código de desbloqueo — siempre responde 200, exista o no la cuenta
  async resendUnlockCode(identifier: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/resend-unlock-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const body = await parseAuthBody(response);

    if (!response.ok) {
      throw new Error('No se pudo reenviar el código. Intenta de nuevo.');
    }

    return body;
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
