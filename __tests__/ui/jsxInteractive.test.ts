import { describe, expect, it } from 'vitest';
import { scanJsx } from './jsxInteractive';

// Los fragmentos van en cadenas (no en archivos .tsx sueltos) para que `tsc` no los compile.
const wrap = (jsx: string) => `export default function X() { return (<>${jsx}</>); }`;
const scan = (jsx: string) => scanJsx('Fragment.tsx', wrap(jsx));
const rules = (jsx: string) => scan(jsx).map((v) => v.rule);

describe('scanJsx · botones sin acción', () => {
  it('<button> sin onClick, sin type="submit" y sin disabled es una violación', () => {
    const [v] = scan('<button className="x">Participar ahora</button>');
    expect(v).toMatchObject({
      file: 'Fragment.tsx',
      line: 1,
      rule: 'dead-button',
      text: 'Participar ahora',
    });
  });

  it('<motion.button> se trata igual que <button>', () => {
    expect(rules('<motion.button>Ir</motion.button>')).toEqual(['dead-button']);
  });

  it('no es violación con onClick, type="submit", disabled o props esparcidas', () => {
    expect(rules('<button onClick={go}>Ir</button>')).toEqual([]);
    expect(rules('<button type="submit">Enviar</button>')).toEqual([]);
    expect(rules('<button disabled>Próximamente</button>')).toEqual([]);
    expect(rules('<button {...props}>Ir</button>')).toEqual([]);
  });

  it('type="button" sin onClick sigue siendo violación', () => {
    expect(rules('<button type="button">Ir</button>')).toEqual(['dead-button']);
  });

  it('onClick vacío es violación', () => {
    expect(rules('<button onClick={() => {}}>Ir</button>')).toEqual(['empty-onclick']);
    expect(rules('<button onClick={() => null}>Ir</button>')).toEqual(['empty-onclick']);
    expect(rules('<button onClick={function () {}}>Ir</button>')).toEqual(['empty-onclick']);
  });

  it('un onClick con cuerpo real no es violación', () => {
    expect(rules('<button onClick={() => { go(); }}>Ir</button>')).toEqual([]);
    expect(rules('<button onClick={() => go()}>Ir</button>')).toEqual([]);
  });

  it('sin texto visible usa aria-label y, si no, la etiqueta con sus atributos literales (sin clases)', () => {
    expect(scan('<button aria-label="Cerrar"><X /></button>')[0].text).toBe('Cerrar');
    expect(scan('<button className="icono" title="Ver"><X /></button>')[0].text).toBe('<button title="Ver">');
    expect(scan('<a href="#" className="w-8 h-8"><X /></a>')[0].text).toBe('<a href="#">');
  });
});

describe('scanJsx · enlaces sin destino', () => {
  it('href "#", vacío o ausente es violación', () => {
    expect(rules('<a href="#">Redes</a>')).toEqual(['dead-link']);
    expect(rules('<Link href="">Ir</Link>')).toEqual(['dead-link']);
    expect(rules('<a>Ir</a>')).toEqual(['dead-link']);
    expect(rules('<a href={"#"}>Ir</a>')).toEqual(['dead-link']);
  });

  it('un ancla a una sección (href="#rifas") no es violación', () => {
    expect(rules('<a href="#rifas">Rifas</a>')).toEqual([]);
  });

  it('href dinámico o props esparcidas no son violación', () => {
    expect(rules('<Link href={`/raffles/${id}`}>Ir</Link>')).toEqual([]);
    expect(rules('<a {...rest}>Ir</a>')).toEqual([]);
  });
});

describe('scanJsx · botón dentro de enlace', () => {
  it('<Link> con <button> dentro es violación de anidación (y no cuenta además como botón muerto)', () => {
    const [v, ...rest] = scan('<Link href="/x"><button>Ir</button></Link>');
    expect(rest).toEqual([]);
    expect(v).toMatchObject({ rule: 'button-in-link', text: 'Ir' });
  });

  it('el botón puede estar más abajo, dentro de otros elementos', () => {
    expect(rules('<a href="/x"><span><button onClick={go}>Ir</button></span></a>')).toEqual(['button-in-link']);
  });

  it('el botón puede estar dentro de un map', () => {
    expect(
      rules('<Link href="/x">{items.map((i) => <button key={i}>{i}</button>)}</Link>'),
    ).toEqual(['button-in-link']);
  });

  it('<Link> dentro de <button> es violación', () => {
    expect(rules('<button onClick={go}><Link href="/x">Ir</Link></button>')).toEqual(['link-in-button']);
  });

  it('un <button> hermano de un <Link> no es violación', () => {
    expect(rules('<div><Link href="/x">Ir</Link><button onClick={go}>Otro</button></div>')).toEqual([]);
  });
});

describe('scanJsx · general', () => {
  it('devuelve la línea correcta y no lee disco', () => {
    const source = 'export default function X() {\n  return (\n    <div>\n      <button>Ir</button>\n    </div>\n  );\n}\n';
    expect(scanJsx('No/Existe.tsx', source)).toEqual([
      { file: 'No/Existe.tsx', line: 4, rule: 'dead-button', text: 'Ir' },
    ]);
  });

  it('un archivo sin violaciones devuelve una lista vacía', () => {
    expect(scan('<div><button onClick={go}>Ir</button><Link href="/x">Ir</Link></div>')).toEqual([]);
  });
});
