import { describe, expect, it } from 'vitest';
import { pnpmCommand } from '../../scripts/pnpm-command.mjs';

describe('pnpmCommand', () => {
  const args = ['audit', '--prod', '--json'];

  it('dentro de `pnpm run`: lanza el JS de pnpm con el mismo Node, sin shell', () => {
    const execPath = '/home/u/.cache/node/corepack/pnpm/10.28.0/bin/pnpm.cjs';
    const r = pnpmCommand(args, { npm_execpath: execPath }, 'node-propio');
    expect(r.command).toBe('node-propio');
    expect(r.args).toEqual([execPath, ...args]);
  });

  it('ruta de Windows con barras invertidas', () => {
    const execPath = 'C:\\Users\\u\\corepack\\pnpm\\10.28.0\\bin\\pnpm.cjs';
    const r = pnpmCommand(args, { npm_execpath: execPath }, 'node-propio');
    expect(r.command).toBe('node-propio');
    expect(r.args).toEqual([execPath, ...args]);
  });

  it('fuera de pnpm (sin npm_execpath): usa `pnpm` del PATH', () => {
    expect(pnpmCommand(args, {}, 'node-propio')).toEqual({ command: 'pnpm', args });
  });

  it('npm_execpath de otro gestor (npm): no lo usa', () => {
    const r = pnpmCommand(args, { npm_execpath: '/usr/lib/node_modules/npm/bin/npm-cli.js' }, 'node-propio');
    expect(r).toEqual({ command: 'pnpm', args });
  });

  it('npm_execpath de pnpm que no es un archivo JS (binario): usa `pnpm` del PATH', () => {
    const r = pnpmCommand(args, { npm_execpath: '/usr/local/bin/pnpm' }, 'node-propio');
    expect(r).toEqual({ command: 'pnpm', args });
  });
});
