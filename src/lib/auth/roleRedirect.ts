// lib/auth/roleRedirect.ts
// Mapa único rol -> panel de destino. Usado tanto al iniciar sesión como
// al detectar una sesión activa en la landing pública, para no duplicar
// la lógica de "a dónde va cada rol" en varios lugares.

export const ROLE_HOME_PATHS: Record<string, string> = {
  ROLE_ADMIN: '/admin',
  ROLE_CONSUMER: '/home',
  ROLE_COMMERCIAL: '/commercial',
  ROLE_GAME_DESIGNER: '/game-designer',
  ROLE_COMPLIANCE_OFFICER: '/compliance',
};

export function getRoleHomePath(role?: string | null): string | null {
  if (!role) return null;
  return ROLE_HOME_PATHS[role] ?? null;
}

// Destino de "Volver al inicio" del aviso "En desarrollo": el panel del rol, o la landing sin sesión.
export function getUnderDevelopmentExitHref(role?: string | null): string {
  return getRoleHomePath(role) ?? '/';
}
