#!/usr/bin/env node
// Puerta de auditoría de dependencias de producción con excepciones escritas (spec 010, RN-10).
//
// Corre `npm audit --omit=dev --json` y decide con `evaluateAudit`. La excepción es por AVISO
// (id GHSA) y paquete, no por paquete: un aviso alto nuevo en un paquete exceptuado sigue fallando.
// Códigos de salida:
//   0  sin avisos altos/críticos fuera de excepción, y excepciones válidas y vigentes
//   1  hay vulnerabilidades altas/críticas sin excepción, o una excepción inválida o vencida
//   2  no se pudo auditar: registro de npm inalcanzable o falta el lockfile (no es un hallazgo)
//   3  error interno (archivo de excepciones ilegible, fallo al lanzar npm)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const EXCEPTIONS_FILE = 'security/audit-exceptions.json';
export const AUDIT_EXIT = { OK: 0, VULNERABILITIES: 1, REGISTRY: 2, INTERNAL: 3 };
const BLOCKING = new Set(['high', 'critical']);
const REQUIRED_FIELDS = ['id', 'package', 'reason', 'approvedBy', 'approvedOn', 'reviewBy'];

const isIsoDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

/**
 * Avisos altos o críticos del reporte, uno por id. Las entradas `via` que son texto son
 * paquetes derivados (el aviso se cuenta donde nace), así que se ignoran.
 * @param {any} report
 * @returns {{id:string, package:string, severity:string, title:string}[]}
 */
export function listAdvisories(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== 'object' || via === null || !BLOCKING.has(via.severity)) continue;
      const ghsa = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i.exec(via.url ?? '');
      const id = ghsa ? ghsa[0] : `npm-${via.source}`;
      found.set(`${via.name}:${id}`, {
        id,
        package: via.name,
        severity: via.severity,
        title: via.title ?? '',
      });
    }
  }
  return [...found.values()];
}

/**
 * Decide si la auditoría pasa. Función pura.
 * @param {any} report salida de `npm audit --json`
 * @param {any[]} exceptions contenido de `security/audit-exceptions.json`
 * @param {string} today fecha de hoy, AAAA-MM-DD
 * @returns {{ok:boolean, code:number, failures:string[], warnings:string[], active:string[]}}
 */
export function evaluateAudit(report, exceptions, today) {
  const failures = [];
  const warnings = [];
  const active = [];

  // "No se pudo consultar" no es "hay vulnerabilidades": otro mensaje y otro código.
  const reachable =
    report &&
    typeof report === 'object' &&
    !report.error &&
    typeof report.vulnerabilities === 'object' &&
    report.vulnerabilities !== null;
  if (!reachable) {
    const detail = report && report.error ? ` (${report.error.code ?? 'sin código'})` : '';
    // Sin lockfile no hay nada que auditar: no es el registro, y reintentar no lo arregla.
    const message =
      report && report.error && report.error.code === 'ENOLOCK'
        ? 'Falta el lockfile (package-lock.json), así que npm no tiene qué auditar (ENOLOCK). ' +
          'No es un hallazgo de seguridad: restáuralo con el repositorio o corre `npm install --package-lock-only`.'
        : `No se pudo consultar el registro de npm${detail}. No es un hallazgo de seguridad: reintenta la corrida.`;
    return {
      ok: false,
      code: AUDIT_EXIT.REGISTRY,
      failures: [message],
      warnings,
      active,
    };
  }

  // Excepciones: campos obligatorios, fechas válidas, vigencia.
  const valid = new Map();
  for (const [index, entry] of (Array.isArray(exceptions) ? exceptions : []).entries()) {
    const label = `Excepción #${index + 1}${entry && entry.id ? ` (${entry.id})` : ''}`;
    const missing = REQUIRED_FIELDS.filter(
      (field) => !entry || typeof entry[field] !== 'string' || entry[field].trim() === '',
    );
    if (missing.length > 0) {
      failures.push(`${label} incompleta: falta ${missing.join(', ')}.`);
      continue;
    }
    if (!isIsoDate(entry.approvedOn) || !isIsoDate(entry.reviewBy)) {
      failures.push(`${label} tiene una fecha inválida (approvedOn/reviewBy): se espera AAAA-MM-DD.`);
      continue;
    }
    if (entry.reviewBy < today) {
      failures.push(
        `${label} venció el ${entry.reviewBy} (hoy ${today}): revisa el aviso y renueva la fecha o corrige la dependencia.`,
      );
      continue;
    }
    valid.set(`${entry.package}:${entry.id}`, entry);
  }

  const advisories = listAdvisories(report);
  const used = new Set();
  for (const advisory of advisories) {
    const key = `${advisory.package}:${advisory.id}`;
    const entry = valid.get(key);
    if (entry) {
      used.add(key);
      active.push(
        `${advisory.id} (${advisory.package}, ${advisory.severity}) exceptuado hasta revisar el ${entry.reviewBy}; aprobó ${entry.approvedBy}.`,
      );
    } else {
      failures.push(
        `Vulnerabilidad ${advisory.severity} sin excepción: ${advisory.id} en ${advisory.package}` +
          `${advisory.title ? ` - ${advisory.title}` : ''}.`,
      );
    }
  }
  for (const key of valid.keys()) {
    if (!used.has(key)) {
      warnings.push(`La excepción ${key.split(':')[1]} (${key.split(':')[0]}) ya no corresponde a ningún aviso: puedes quitarla.`);
    }
  }

  const ok = failures.length === 0;
  return { ok, code: ok ? AUDIT_EXIT.OK : AUDIT_EXIT.VULNERABILITIES, failures, warnings, active };
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Corre `npm audit` hasta 3 veces mientras el registro no responda. Devuelve el reporte o null. */
function runAudit() {
  let report = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const run = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
      encoding: 'utf8',
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    });
    if (run.error && run.error.code !== 'ETIMEDOUT') throw run.error;
    try {
      report = JSON.parse(run.stdout);
    } catch {
      report = null;
    }
    // npm sale con 1 también cuando hay hallazgos; solo reintentamos si no hay reporte útil.
    if (report && !report.error && report.vulnerabilities) return report;
    if (report && report.error && report.error.code === 'ENOLOCK') return report; // reintentar no lo arregla
    if (attempt < 3) {
      console.warn(`Aviso: el registro no respondió (intento ${attempt} de 3); se reintenta.`);
      sleep(3000);
    }
  }
  return report;
}

function main() {
  let exceptions;
  let report;
  try {
    exceptions = JSON.parse(readFileSync(EXCEPTIONS_FILE, 'utf8')).exceptions;
    if (!Array.isArray(exceptions)) throw new Error('falta la lista "exceptions"');
    report = runAudit();
  } catch (error) {
    console.error(`Error interno de la puerta de auditoría: ${error.message}`);
    process.exit(AUDIT_EXIT.INTERNAL);
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = evaluateAudit(report, exceptions, today);
  for (const line of result.active) console.log(`Excepción vigente: ${line}`);
  for (const line of result.warnings) console.warn(`Aviso: ${line}`);
  for (const line of result.failures) console.error(`- ${line}`);
  if (result.ok) console.log('Auditoría: sin vulnerabilidades altas ni críticas fuera de excepción.');
  else if (result.code === AUDIT_EXIT.REGISTRY) console.error('Salida 2: no se pudo auditar (registro inalcanzable o sin lockfile; ver arriba).');
  else console.error('Salida 1: hay vulnerabilidades sin excepción o excepciones inválidas.');
  process.exit(result.code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
