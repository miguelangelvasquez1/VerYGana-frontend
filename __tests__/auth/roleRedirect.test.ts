import { describe, expect, it } from 'vitest';
import { getUnderDevelopmentExitHref } from '@/lib/auth/roleRedirect';

// Destino de "Volver al inicio" del aviso de Recargas (spec 016, CA-4 y D-5).

describe('getUnderDevelopmentExitHref', () => {
  it('lleva al consumidor a /home', () => {
    expect(getUnderDevelopmentExitHref('ROLE_CONSUMER')).toBe('/home');
  });

  it.each([undefined, null, ''])('lleva a / sin sesión (%s)', (role) => {
    expect(getUnderDevelopmentExitHref(role)).toBe('/');
  });

  it.each([
    ['ROLE_ADMIN', '/admin'],
    ['ROLE_COMMERCIAL', '/commercial'],
    ['ROLE_COMPLIANCE_OFFICER', '/compliance'],
    ['ROLE_GAME_DESIGNER', '/game-designer'],
  ])('lleva a %s a su panel %s', (role, href) => {
    expect(getUnderDevelopmentExitHref(role)).toBe(href);
  });

  it('lleva un rol desconocido a /', () => {
    expect(getUnderDevelopmentExitHref('ROLE_OTRO')).toBe('/');
  });
});
