import { describe, expect, it } from 'vitest';
import {
  isMobileBarItemActive,
  MOBILE_BAR_ITEMS,
  MOBILE_MENU_ITEMS,
} from '@/components/bars/mobileNav';

// CA-6, CA-7 y CA-8 de la spec 013: la barra inferior del celular y el menú de Perfil.

const bar = (label: string) => MOBILE_BAR_ITEMS.find((item) => item.label === label)!;

describe('barra inferior del celular', () => {
  it('muestra, en orden, Inicio, Anuncios, Juegos, Mascota y Productos (Perfil es el botón del menú)', () => {
    expect(MOBILE_BAR_ITEMS.map((item) => item.label)).toEqual([
      'Inicio',
      'Anuncios',
      'Juegos',
      'Mascota',
      'Productos',
    ]);
  });

  it('Juegos lleva a /games y Rifas ya no está en la barra', () => {
    expect(bar('Juegos').href).toBe('/games');
    expect(MOBILE_BAR_ITEMS.map((item) => item.label)).not.toContain('Rifas');
  });

  it('Juegos se marca activo en /games y en sus subrutas, y no en /gamesx ni /home', () => {
    const juegos = bar('Juegos');
    expect(isMobileBarItemActive('/games', juegos)).toBe(true);
    expect(isMobileBarItemActive('/games/play', juegos)).toBe(true);
    expect(isMobileBarItemActive('/gamesx', juegos)).toBe(false);
    expect(isMobileBarItemActive('/home', juegos)).toBe(false);
  });

  it('los demás elementos siguen con comparación exacta', () => {
    expect(isMobileBarItemActive('/products', bar('Productos'))).toBe(true);
    expect(isMobileBarItemActive('/products/1', bar('Productos'))).toBe(false);
    expect(isMobileBarItemActive('/home', bar('Inicio'))).toBe(true);
    expect(isMobileBarItemActive('/ads', bar('Anuncios'))).toBe(true);
    expect(isMobileBarItemActive('/pet', bar('Mascota'))).toBe(true);
  });
});

describe('menú de Perfil del celular', () => {
  const entries = MOBILE_MENU_ITEMS.map((item) => [item.label, item.href]);

  it('agrega Rifas hacia /raffles', () => {
    expect(entries).toContainEqual(['Rifas', '/raffles']);
  });

  it('pone Rifas justo después de Juegos', () => {
    const labels = MOBILE_MENU_ITEMS.map((item) => item.label);
    expect(labels.indexOf('Rifas')).toBe(labels.indexOf('Juegos') + 1);
  });

  it('conserva Juegos y los once enlaces de antes con sus destinos', () => {
    expect(entries).toContainEqual(['Juegos', '/games']);
    expect(entries).toEqual(
      expect.arrayContaining([
        ['Mi Nivel', '/explore/gamification'],
        ['Mi Perfil', '/explore/profile'],
        ['Mis compras', '/explore/purchases'],
        ['Mis favoritos', '/explore/favorites'],
        ['Mis participaciones', '/explore/participations'],
        ['Mis Referidos', '/explore/referrals'],
        ['Juegos', '/games'],
        ['Encuestas', '/surveys'],
        ['Recargas', '/plans/mobile-plans'],
        ['Foro', '/forum'],
        ['Soporte', '/support'],
      ]),
    );
    expect(MOBILE_MENU_ITEMS).toHaveLength(12);
  });
});
