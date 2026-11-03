import { describe, expect, it } from 'vitest';
import { scanPanelJsx } from './jsxPanels';

// Los fragmentos van en cadenas (no en archivos .tsx sueltos) para que `tsc` no los compile.
const wrap = (jsx: string) => `export default function X() { return (<>${jsx}</>); }`;
const scan = (jsx: string) => scanPanelJsx('Fragment.tsx', wrap(jsx));
const rules = (jsx: string) => scan(jsx).map((v) => v.rule);

describe('scanPanelJsx · hover-only (RN-2)', () => {
  it('onMouseEnter sin onClick es violación, con archivo, línea, regla y texto', () => {
    const [v] = scan('<button onMouseEnter={f}>Ayuda</button>');
    expect(v).toMatchObject({ file: 'Fragment.tsx', line: 1, rule: 'hover-only', text: 'Ayuda' });
  });

  it('onMouseEnter con onClick no es violación', () => {
    expect(rules('<button onMouseEnter={f} onClick={g}>Ayuda</button>')).toEqual([]);
  });

  it('opacity-0 revelado solo con group-hover es violación', () => {
    expect(rules('<div className="opacity-0 group-hover:opacity-100">Editar</div>')).toEqual(['hover-only']);
  });

  it('opacity-100 de celular con lg: que lo oculta y lo revela con el ratón no es violación', () => {
    expect(rules('<div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100">Editar</div>')).toEqual([]);
  });

  it('group-focus-within sin variante de celular sigue siendo violación (el toque no enfoca en iOS)', () => {
    expect(rules('<div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">Editar</div>')).toEqual([
      'hover-only',
    ]);
  });

  it('invisible revelado con group-hover es violación', () => {
    expect(rules('<div className="invisible group-hover:visible">Editar</div>')).toEqual(['hover-only']);
  });

  it('hidden revelado con group-hover es violación', () => {
    expect(rules('<div className="hidden group-hover:block">Editar</div>')).toEqual(['hover-only']);
  });

  it('lee las clases de una plantilla y de una expresión', () => {
    expect(rules('<div className={`p-2 opacity-0 group-hover:opacity-100 ${x}`}>Editar</div>')).toEqual(['hover-only']);
    expect(rules("<div className={cn('p-2', 'opacity-0 group-hover:opacity-100')}>Editar</div>")).toEqual(['hover-only']);
  });

  it('opacity-0 sin ninguna revelación por hover no es violación', () => {
    expect(rules('<div className="opacity-0 transition">Animación</div>')).toEqual([]);
  });
});

describe('scanPanelJsx · table-without-scroll (RN-4)', () => {
  it('un <table> suelto es violación', () => {
    const [v] = scan('<table><thead><tr><th>Nombre</th><th>Estado</th></tr></thead></table>');
    expect(v).toMatchObject({ file: 'Fragment.tsx', line: 1, rule: 'table-without-scroll', text: 'Nombre | Estado' });
  });

  it('<TableScroll><table/></TableScroll> no es violación', () => {
    expect(rules('<TableScroll label="Usuarios"><table /></TableScroll>')).toEqual([]);
  });

  it('<TableScroll><div><table/></div></TableScroll> no es violación', () => {
    expect(rules('<TableScroll label="Usuarios"><div><table /></div></TableScroll>')).toEqual([]);
  });

  it('un div con overflow-x-auto sin la señal de RN-4 es violación', () => {
    expect(rules('<div className="overflow-x-auto"><table /></div>')).toEqual(['table-without-scroll']);
  });

  it('sin encabezados el texto es la etiqueta', () => {
    expect(scan('<table />')[0].text).toBe('<table>');
  });
});
