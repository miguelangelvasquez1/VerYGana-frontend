// Ayudantes de los barridos estáticos de la spec 017. Son una copia de los de
// `__tests__/expediente/expedienteStatic.test.ts`: no se importan desde un archivo de prueba.

// Quita comentarios para no marcar una mención en un texto explicativo.
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

export function mentions(source: string, pattern: RegExp): boolean {
  return pattern.test(stripComments(source));
}

// Un `useRef` booleano comprobado en la primera línea del envío.
export function guardsDoubleSubmit(source: string): boolean {
  const code = stripComments(source);
  const ref = /const\s+(\w+)\s*=\s*useRef\(\s*false\s*\)/.exec(code);
  if (!ref) return false;
  const first = new RegExp(
    `const\\s+onSubmit\\s*=\\s*async[^{]*\\{\\s*if\\s*\\(\\s*${ref[1]}\\.current\\s*\\)\\s*return`,
  );
  return first.test(code);
}
