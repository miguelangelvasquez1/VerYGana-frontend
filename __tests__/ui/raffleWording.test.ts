import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './consumerScope';
import { findRaffleWording, scanDirectory } from './raffleWording';

// Los fragmentos van en cadenas (no en archivos .tsx sueltos) para que `tsc` no los compile.
const scan = (source: string) => findRaffleWording('Fragment.tsx', source);
const texts = (source: string) => scan(source).map((v) => v.text);

describe('findRaffleWording · lo que marca', () => {
  it('una cadena con la palabra', () => {
    expect(texts('const a = "Rifas";')).toEqual(['Rifas']);
    expect(texts("const a = 'la rifa';")).toEqual(['la rifa']);
  });

  it('plantillas, con y sin sustituciones', () => {
    expect(texts('const a = `rifas ${x} activas`;')).toEqual(['rifas']);
    expect(texts('const a = `Ver rifas`;')).toEqual(['Ver rifas']);
    expect(texts('const a = `${x} de rifa`;')).toEqual(['de rifa']);
  });

  it('texto de JSX y atributos', () => {
    expect(texts('const a = <p>Ver rifas</p>;')).toEqual(['Ver rifas']);
    expect(texts('const a = <button title="Eliminar rifa" />;')).toEqual(['Eliminar rifa']);
  });

  it('no distingue mayúsculas', () => {
    expect(texts('const a = "RIFAR";')).toEqual(['RIFAR']);
  });

  it('informa la línea', () => {
    expect(scan('const a = 1;\nconst b = "rifa";')[0]).toMatchObject({ file: 'Fragment.tsx', line: 2 });
  });
});

describe('findRaffleWording · lo que no marca', () => {
  it('palabras que solo contienen "rifa"', () => {
    expect(scan('const a = "Tarifa mensual";')).toEqual([]);
    expect(scan('const RifasLayout = 1;')).toEqual([]);
  });

  it('comentarios', () => {
    expect(scan('// la rifa\nconst a = 1;')).toEqual([]);
    expect(scan('/** rifa */\nconst a = 1;')).toEqual([]);
    expect(scan('const a = <div>{/* rifa */}</div>;')).toEqual([]);
  });

  it('especificadores de import y export', () => {
    expect(scan("import x from './rifa';")).toEqual([]);
    expect(scan("export * from './rifas';")).toEqual([]);
    expect(scan("const m = await import('./rifa');")).toEqual([]);
  });

  it('rutas', () => {
    expect(scan('const a = "/raffles";')).toEqual([]);
  });
});

describe('src · ningún texto dice "rifa" (CA-1, RN-1)', () => {
  it('el barrido de src no encuentra ninguno', () => {
    const found = scanDirectory(REPO_ROOT, 'src').map((v) => `${v.file}:${v.line}: ${v.text}`);
    expect(found).toEqual([]);
  });
});
