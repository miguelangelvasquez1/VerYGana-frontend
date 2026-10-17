#!/usr/bin/env node
// Puerta de lint con tope que solo baja (spec 010, RN-2).
//
// Corre `next lint` una sola vez, lee el reporte JSON y decide con `evaluateLint`.
// Códigos de salida:
//   0  lint dentro de las reglas
//   1  la puerta falla (errores, avisos por encima o por debajo del tope, tope subido)
//   3  no se pudo ejecutar la puerta (lint sin reporte, tope ilegible, rama destino ausente en un PR)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CAP_FILE = '.lint-max-warnings';
export const REPORT_FILE = '.lint-report.json';
// Conteo medido al crear la puerta: se usa si la rama destino aún no tiene el archivo.
export const DEFAULT_BASE_CAP = 360;

/** Lee un entero no negativo; cualquier otra cosa da NaN. */
export function parseCap(text) {
  const trimmed = String(text).trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** Suma errores y avisos del reporte JSON de ESLint (una entrada por archivo). */
export function summarizeEslintReport(report) {
  if (!Array.isArray(report)) {
    throw new Error('El reporte de lint no tiene el formato esperado (se esperaba una lista).');
  }
  let errors = 0;
  let warnings = 0;
  for (const file of report) {
    errors += Number(file.errorCount) || 0;
    warnings += Number(file.warningCount) || 0;
  }
  return { errors, warnings };
}

/**
 * Decide si el lint pasa. Función pura.
 * @param {{errors:number, warnings:number, cap:number, baseCap:number}} input
 * @returns {{ok:boolean, messages:string[]}}
 */
export function evaluateLint({ errors, warnings, cap, baseCap }) {
  const messages = [];
  if (!Number.isInteger(cap) || cap < 0) {
    messages.push(`El tope de ${CAP_FILE} no es un entero válido.`);
    return { ok: false, messages };
  }
  if (errors > 0) {
    messages.push(`Hay ${errors} error(es) de lint: corrígelos (los errores nunca se toleran).`);
  }
  if (warnings > cap) {
    messages.push(
      `Hay ${warnings} avisos de lint y el tope es ${cap}: tu cambio agregó ${warnings - cap}. ` +
        'Corrígelos; el tope nunca se sube.',
    );
  }
  if (cap > baseCap) {
    messages.push(
      `El tope (${cap}) es mayor que el de la rama destino (${baseCap}): el tope nunca se sube. ` +
        `Déjalo en ${baseCap} o menos.`,
    );
  }
  if (warnings < cap) {
    messages.push(
      `Hay ${warnings} avisos y el tope es ${cap}: baja el tope a ${warnings} en ${CAP_FILE} ` +
        'para que la mejora no se pierda.',
    );
  }
  return { ok: messages.length === 0, messages };
}

function git(args) {
  return spawnSync('git', args, { encoding: 'utf8' });
}

const SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Decide contra qué se compara el tope. Función pura (lee solo `env`).
 *
 * - Fuera de GitHub Actions (ensayos locales): `LINT_BASE_CAP` fija el número; `LINT_BASE_REF`
 *   cambia la referencia; sin nada, `origin/main`.
 * - En GitHub Actions ambas variables se ignoran (con aviso): si no, un cambio en el workflow o
 *   en `package.json` podría subir el tope sin que la puerta lo vea.
 * - En un PR: `origin/$GITHUB_BASE_REF`, obligatoria.
 * - En un push: el commit anterior al push (`LINT_BASE_SHA`, que el workflow toma de
 *   `github.event.before`). En un push `origin/main` ya es el commit nuevo y el tope se compararía
 *   consigo mismo. Si ese commit no es válido (rama nueva, SHA en ceros), `ref` es `null` y se
 *   usa el respaldo.
 * @returns {{kind:'forced', cap:string, notes:string[]} | {kind:'ref', ref:string|null, required:boolean, notes:string[]}}
 */
export function resolveBaseSource(env) {
  // `GITHUB_ACTIONS` definida pero vacía (p. ej. `GITHUB_ACTIONS= npm run lint:ci`) cuenta como CI,
  // y también `CI`. Límite conocido: quien quite ambas con `env -u` desactiva la detección; se ve en
  // el diff (`package.json` o el workflow) y GitHub no deja sobrescribir `GITHUB_*` desde `env:`.
  const inCi = env.GITHUB_ACTIONS !== undefined || Boolean(env.CI);
  const notes = [];

  if (inCi) {
    for (const name of ['LINT_BASE_CAP', 'LINT_BASE_REF']) {
      if (env[name] !== undefined) {
        notes.push(`Aviso: ${name} se ignora en GitHub Actions; el tope se compara con la rama real.`);
      }
    }
    if (env.GITHUB_BASE_REF) {
      return { kind: 'ref', ref: `origin/${env.GITHUB_BASE_REF}`, required: true, notes };
    }
    const before = String(env.LINT_BASE_SHA ?? '');
    if (SHA_PATTERN.test(before) && !/^0+$/.test(before)) {
      return { kind: 'ref', ref: before, required: false, notes };
    }
    notes.push(
      `Aviso: no hay commit anterior válido al push; se usa el respaldo ${DEFAULT_BASE_CAP}.`,
    );
    return { kind: 'ref', ref: null, required: false, notes };
  }

  if (env.LINT_BASE_CAP !== undefined) {
    return { kind: 'forced', cap: env.LINT_BASE_CAP, notes };
  }
  return { kind: 'ref', ref: env.LINT_BASE_REF || 'origin/main', required: false, notes };
}

/**
 * Tope de la rama destino, con lo que decide `resolveBaseSource`:
 * `git show <ref>:.lint-max-warnings`. Solo lectura. Archivo o commit ausente: DEFAULT_BASE_CAP
 * (en un PR, una rama destino ausente es un error).
 */
function resolveBaseCap() {
  const source = resolveBaseSource(process.env);
  for (const note of source.notes) console.warn(note);

  if (source.kind === 'forced') {
    const forced = parseCap(source.cap);
    if (Number.isNaN(forced)) throw new Error('LINT_BASE_CAP no es un entero válido.');
    return { baseCap: forced, source: 'LINT_BASE_CAP' };
  }
  const { ref, required } = source;
  if (ref === null) return { baseCap: DEFAULT_BASE_CAP, source: 'respaldo' };

  if (git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status !== 0) {
    if (required) {
      throw new Error(`No existe ${ref} en el runner: falta traer la rama destino antes del lint.`);
    }
    console.warn(`Aviso: no se encontró ${ref} (sin fetch o sin remoto); se usa ${DEFAULT_BASE_CAP}.`);
    return { baseCap: DEFAULT_BASE_CAP, source: 'respaldo' };
  }
  const shown = git(['show', `${ref}:${CAP_FILE}`]);
  if (shown.status !== 0) {
    console.warn(`Aviso: ${CAP_FILE} aún no existe en ${ref}; se usa ${DEFAULT_BASE_CAP}.`);
    return { baseCap: DEFAULT_BASE_CAP, source: 'respaldo' };
  }
  const baseCap = parseCap(shown.stdout);
  if (Number.isNaN(baseCap)) throw new Error(`${CAP_FILE} en ${ref} no es un entero válido.`);
  return { baseCap, source: ref };
}

function main() {
  try {
    const cap = parseCap(readFileSync(CAP_FILE, 'utf8'));
    const { baseCap, source } = resolveBaseCap();

    rmSync(REPORT_FILE, { force: true });
    // `next lint` sale con 1 si hay errores; el veredicto lo da el reporte, no su salida.
    const run = spawnSync('npx', ['next', 'lint', '--format', 'json', '--output-file', REPORT_FILE], {
      encoding: 'utf8',
    });
    if (!existsSync(REPORT_FILE)) {
      console.error('`next lint` no produjo reporte.');
      if (run.stderr) console.error(run.stderr.slice(0, 2000));
      process.exit(3);
    }
    const { errors, warnings } = summarizeEslintReport(JSON.parse(readFileSync(REPORT_FILE, 'utf8')));
    rmSync(REPORT_FILE, { force: true });

    console.log(`Lint: ${errors} errores, ${warnings} avisos. Tope ${cap}; tope de la rama destino ${baseCap} (${source}).`);
    const result = evaluateLint({ errors, warnings, cap, baseCap });
    for (const message of result.messages) console.error(`- ${message}`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(`No se pudo ejecutar la puerta de lint: ${error.message}`);
    process.exit(3);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
