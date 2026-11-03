import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DESKTOP_NAV_LABELS_MIN_WIDTH_PX as N } from '@/components/bars/mobileNav';

// CA-7 y CA-2 de la spec 016: la barra de escritorio muestra el texto de los accesos solo desde un ancho medido,
// y por debajo deja el ícono con nombre accesible. Las clases de Tailwind son literales, así que se leen como texto.

const source = readFileSync(join(process.cwd(), 'src/components/bars/NavBarFrame.tsx'), 'utf8');

describe('accesos de la barra de escritorio', () => {
  it('el corte es un múltiplo de 16 y cubre el ancho medido con textos (1870 px)', () => {
    expect(N % 16).toBe(0);
    expect(N).toBeGreaterThanOrEqual(1870);
    expect(N).toBeLessThan(1870 + 16);
  });

  it('ya no usa 2xl: ni en btnBase ni en los accesos', () => {
    const btnBase = source.split('\n').find((line) => line.startsWith('const btnBase'))!;
    expect(btnBase).not.toContain('2xl:');
    const start = source.indexOf('{/* NAV BUTTONS */}');
    const end = source.indexOf('{/* -------- WALLET');
    expect(source.slice(start, end)).not.toContain('2xl:');
  });

  it('cambia de ícono a texto con las clases del corte', () => {
    expect(source).toContain(`min-[${N}px]:hidden`);
    expect(source).toContain(`min-[${N}px]:inline`);
    expect(source).toContain(`min-[${N}px]:px-4`);
    expect(source).toContain(`min-[${N}px]:py-2`);
    expect(source).toContain(`min-[${N}px]:gap-3`);
  });

  it('cada acceso lleva aria-label y title con su etiqueta, y el ícono va oculto al lector', () => {
    expect(source).toContain('aria-label={label}');
    expect(source).toContain('title={label}');
    expect(source).toContain('aria-hidden="true"');
  });

  // D-2 = (a) de la spec 016: de 1024 a 1279 px, menos relleno, menos separación y sin el texto junto al logo.
  it('compacta el header por debajo de xl y lo deja como antes desde xl', () => {
    const desktop = source.slice(source.indexOf('DESKTOP NAV (top)'), source.indexOf('MOBILE TOP BAR'));
    expect(desktop).toContain("minimal ? 'px-6' : 'px-4 xl:px-6'");
    expect(desktop).toContain("minimal ? 'gap-6' : 'gap-3 xl:gap-6'");
    expect(desktop).toContain("minimal ? 'leading-tight' : 'hidden xl:block leading-tight'");
  });
});
