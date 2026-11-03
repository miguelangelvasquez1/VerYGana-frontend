import { existsSync } from 'node:fs';
import path from 'node:path';
import { importClosure, pageFilesUnder, REPO_ROOT } from './consumerScope';

// Alcance de la spec 014: el cierre de imports desde las páginas y layouts de comercial, admin y
// cumplimiento (C) y de las páginas públicas y de autenticación que no cubrió la 012 (B).
// Se calcula en cada corrida. `src/app/game-designer` queda fuera a propósito.

const PANEL_ROOTS = [
  'commercial',
  'admin',
  'compliance',
  'commercial-onboarding',
  'plans',
  'forgot-password',
  'unlock-account',
  'terminos',
];

/** Puntos de entrada: `page.tsx` y `layout.tsx` bajo las carpetas de B y C. */
export function panelEntries(root: string = REPO_ROOT): string[] {
  return PANEL_ROOTS.flatMap((dir) => pageFilesUnder(root, `src/app/${dir}`)).filter((rel) =>
    existsSync(path.join(root, rel)),
  );
}

export function panelScope(root: string = REPO_ROOT): string[] {
  return importClosure(root, panelEntries(root));
}
