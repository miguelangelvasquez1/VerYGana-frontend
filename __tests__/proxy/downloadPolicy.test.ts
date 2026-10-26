import { describe, expect, it } from 'vitest';
import {
  DOWNLOAD_TIMEOUT_MS,
  MAX_DOWNLOAD_BYTES,
  parseAllowedHosts,
  validateTarget,
} from '@/lib/proxy/downloadPolicy';

// Hosts ficticios: ningún valor real de configuración.
const ALLOWED = parseAllowedHosts('files.example.test');
const ok = (raw: string | null, hosts = ALLOWED) => validateTarget(raw, hosts).ok;

describe('constantes de límite', () => {
  it('el tope es 25 MiB', () => {
    expect(MAX_DOWNLOAD_BYTES).toBe(25 * 1024 * 1024);
  });
  it('el tiempo límite es 60 000 ms', () => {
    expect(DOWNLOAD_TIMEOUT_MS).toBe(60_000);
  });
});

describe('parseAllowedHosts', () => {
  it('pasa a minúsculas, recorta espacios y descarta vacíos', () => {
    const hosts = parseAllowedHosts(' A.Example.test , ,b.example.test,');
    expect([...hosts].sort()).toEqual(['a.example.test', 'b.example.test']);
  });
  it.each([
    ['ausente', undefined],
    ['vacía', ''],
    ['solo comas', ' , ,, '],
  ])('lista %s: conjunto vacío', (_n, raw) => {
    expect(parseAllowedHosts(raw).size).toBe(0);
  });
});

describe('validateTarget: destinos permitidos', () => {
  it('host exacto', () => {
    const r = validateTarget('https://files.example.test/a/b.pdf?sig=abc', ALLOWED);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url.hostname).toBe('files.example.test');
  });
  it('host en mayúsculas', () => {
    expect(ok('https://FILES.Example.TEST/x')).toBe(true);
  });
  it('puerto 443 explícito', () => {
    expect(ok('https://files.example.test:443/x')).toBe(true);
  });
  it('espacios alrededor de la URL (el parser los recorta)', () => {
    expect(ok('  https://files.example.test/x  ')).toBe(true);
  });
  it('host con caracteres codificados que normalizan al permitido', () => {
    expect(ok('https://files.exam%70le.test/x')).toBe(true);
  });
  it('host con ancho completo que normaliza al permitido', () => {
    expect(ok('https://ｆｉｌｅｓ.example.test/x')).toBe(true);
  });
});

describe('validateTarget: destinos internos', () => {
  const internal = [
    'https://127.0.0.1/x',
    'https://localhost/x',
    'https://[::1]/x',
    'https://[::ffff:127.0.0.1]/x',
    'https://169.254.169.254/latest/meta-data',
    'https://2130706433/x', // decimal
    'https://0177.0.0.1/x', // octal
    'https://0x7f000001/x', // hexadecimal
    'https://api/x', // nombre de la red interna
    'https://alloy/x',
  ];
  it.each(internal)('rechaza %s', (u) => {
    expect(ok(u)).toBe(false);
  });
});

describe('validateTarget: esquemas no permitidos', () => {
  it.each([
    'http://files.example.test/x',
    'file:///etc/passwd',
    'data:text/html,<script>1</script>',
    'blob:https://files.example.test/uuid',
    'javascript:alert(1)',
    'ftp://files.example.test/x',
    'files.example.test/x',
    '//files.example.test/x',
  ])('rechaza %s', (u) => {
    expect(ok(u)).toBe(false);
  });
});

describe('validateTarget: variantes del host', () => {
  it.each([
    ['sufijo', 'https://files.example.test.evil.test/x'],
    ['prefijo', 'https://evilfiles.example.test/x'],
    ['subdominio', 'https://sub.files.example.test/x'],
    ['punto final', 'https://files.example.test./x'],
    ['credenciales', 'https://user:pass@files.example.test/x'],
    ['usuario sin clave', 'https://user@files.example.test/x'],
    ['permitido como usuario de otro host', 'https://files.example.test@evil.test/x'],
    ['otro puerto', 'https://files.example.test:8443/x'],
    ['puerto 80', 'https://files.example.test:80/x'],
    ['homógrafo punycode', 'https://xn--fles-xxa.example.test/x'],
    ['homógrafo unicode', 'https://fіles.example.test/x'], // la "і" es cirílica
  ])('rechaza %s', (_n, u) => {
    expect(ok(u)).toBe(false);
  });
});

describe('validateTarget: entradas inválidas', () => {
  it.each([null, '', 'no es una url', 'https://'])('rechaza %j', (u) => {
    expect(ok(u)).toBe(false);
  });
});

describe('validateTarget: listas mal escritas (falla cerrado)', () => {
  it.each([
    ['ausente', undefined],
    ['vacía', ''],
    ['solo comas', ',,,'],
    ['con esquema', 'https://files.example.test'],
    ['con puerto', 'files.example.test:443'],
    ['con comodín', '*.example.test'],
    ['comodín total', '*'],
  ])('lista %s rechaza el destino permitido', (_n, raw) => {
    expect(ok('https://files.example.test/x', parseAllowedHosts(raw))).toBe(false);
  });
});
