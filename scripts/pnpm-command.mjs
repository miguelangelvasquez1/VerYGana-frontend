// Cómo lanzar pnpm desde un script de Node con spawnSync, sin shell y en cualquier sistema.
//
// En Windows `pnpm` (y `npx`) son archivos `.cmd` y spawnSync no los abre sin shell. Cuando el
// script corre con `pnpm run`, pnpm deja en `npm_execpath` el archivo JS de pnpm: se lanza con el
// mismo Node. Fuera de pnpm se usa `pnpm` del PATH.
import { basename } from 'node:path';

/**
 * Función pura.
 * @param {string[]} args argumentos para pnpm
 * @param {Record<string, string | undefined>} env
 * @param {string} nodePath ruta del Node que corre el script
 * @returns {{command: string, args: string[]}}
 */
export function pnpmCommand(args, env = process.env, nodePath = process.execPath) {
  const execPath = env.npm_execpath;
  // Se parte por `/` y `\` a mano: la ruta puede venir de otro sistema que el que corre la prueba.
  const file = execPath ? (execPath.split(/[\\/]/).pop() ?? basename(execPath)) : '';
  if (/^pnpm/i.test(file) && /\.[cm]?js$/i.test(file)) {
    return { command: nodePath, args: [execPath, ...args] };
  }
  return { command: 'pnpm', args };
}
