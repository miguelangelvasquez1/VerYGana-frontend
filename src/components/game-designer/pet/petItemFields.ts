import type { PetItemDraft } from '@/services/PetRequestService';

/**
 * Esquema del ítem del catálogo de mascotas, espejo del JSON Schema con el que
 * el backend valida al publicar.
 *
 * Dos cosas que no se deducen del formulario:
 *   · `price` va en LLAVES, no en centavos. El backend multiplica por
 *     `keyValueCents` internamente — 25 llaves se mandan como 25, no 25000.
 *     (El resto del repo usa centavos: `budgetCents`, `keysValueCents`.)
 *   · `spriteUrl` no se manda nunca. Existe en el DTO de respuesta, pero al
 *     escribir el backend lo ignora y lo arma a partir de `spriteObjectKey`.
 */

export type PetFieldKind = 'text' | 'textarea' | 'int' | 'bool' | 'asset';

export interface PetItemField {
  key: string;
  label: string;
  kind: PetFieldKind;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  help?: string;
  /** Agrupación en la UI. */
  group: 'identidad' | 'tipo' | 'efectos';
  /** Solo aplica si este otro campo booleano está activo. */
  dependsOn?: string;
}

export const PET_ITEM_FIELDS: PetItemField[] = [
  // ── Obligatorios ───────────────────────────────────────────────────────────
  {
    key: 'externalId',
    label: 'ID externo',
    kind: 'int',
    required: true,
    min: 1000,
    group: 'identidad',
    help: 'Identificador con el que el juego reconoce el ítem. Desde 1000: los números menores están reservados.',
  },
  {
    key: 'name',
    label: 'Nombre',
    kind: 'text',
    required: true,
    minLength: 1,
    maxLength: 100,
    group: 'identidad',
  },
  {
    key: 'price',
    label: 'Precio',
    kind: 'int',
    required: true,
    min: 1,
    group: 'identidad',
    help: 'Precio en llaves. Lo cobra el servidor.',
  },

  // ── Opcionales ─────────────────────────────────────────────────────────────
  { key: 'description', label: 'Descripción', kind: 'textarea', maxLength: 500, group: 'identidad' },
  {
    // 'asset' y no 'text': cuando era un campo libre había que teclear la clave de
    // R2 a mano, y lo publicado acabó siendo una clave inexistente o directamente
    // una palabra suelta. La clave la devuelve la subida; nadie debería escribirla.
    key: 'spriteObjectKey',
    label: 'Sprite del ítem',
    kind: 'asset',
    group: 'identidad',
    help: 'PNG, JPEG o WEBP, hasta 25 MB. Sin sprite, el juego usa uno de respaldo.',
  },

  { key: 'active', label: 'Activo', kind: 'bool', group: 'tipo', help: 'Si se omite, el backend lo asume activo.' },
  { key: 'isMedicine', label: 'Es medicina', kind: 'bool', group: 'tipo' },
  { key: 'isDrink', label: 'Es bebida', kind: 'bool', group: 'tipo' },
  {
    key: 'curesAllParts',
    label: 'Cura todas las partes',
    kind: 'bool',
    group: 'tipo',
    dependsOn: 'isMedicine',
    help: 'Solo tiene efecto en ítems marcados como medicina.',
  },

  { key: 'expWhenEating', label: 'Experiencia al consumir', kind: 'int', min: 0, group: 'efectos' },
  { key: 'healthDelta',   label: 'Salud',      kind: 'int', group: 'efectos' },
  { key: 'energyDelta',   label: 'Energía',    kind: 'int', group: 'efectos' },
  { key: 'hungerDelta',   label: 'Hambre',     kind: 'int', group: 'efectos' },
  { key: 'thirstDelta',   label: 'Sed',        kind: 'int', group: 'efectos' },
  { key: 'hygieneDelta',  label: 'Higiene',    kind: 'int', group: 'efectos' },
  { key: 'humorDelta',    label: 'Humor',      kind: 'int', group: 'efectos' },
  { key: 'bodyFatDelta',  label: 'Grasa corporal', kind: 'int', group: 'efectos' },
];

export const PET_ITEM_GROUPS: { id: PetItemField['group']; title: string; hint: string }[] = [
  { id: 'identidad', title: 'Identidad', hint: 'Cómo se llama, cuánto cuesta y con qué se dibuja.' },
  { id: 'tipo',      title: 'Tipo',      hint: 'Qué clase de ítem es.' },
  { id: 'efectos',   title: 'Efectos',   hint: 'Cuánto suma o resta a cada estado. Pueden ser negativos.' },
];

/** Campo por el que el backend rechaza la publicación, con el motivo legible. */
export interface PetFieldIssue {
  key: string;
  label: string;
  message: string;
}

/**
 * Mismas reglas que el schema del backend, para poder avisar antes de gastar un
 * POST que va a volver en 400. No sustituye la validación del servidor.
 */
export function validatePetItem(draft: PetItemDraft): PetFieldIssue[] {
  const issues: PetFieldIssue[] = [];

  for (const f of PET_ITEM_FIELDS) {
    const value = draft[f.key];
    const empty = value === undefined || value === null || value === '';

    if (f.required && empty) {
      issues.push({ key: f.key, label: f.label, message: 'Falta completarlo.' });
      continue;
    }
    if (empty) continue;

    if (f.kind === 'int') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        issues.push({ key: f.key, label: f.label, message: 'Tiene que ser un número entero.' });
      } else if (f.min !== undefined && value < f.min) {
        issues.push({ key: f.key, label: f.label, message: `No puede ser menor que ${f.min}.` });
      }
    }

    if ((f.kind === 'text' || f.kind === 'textarea') && typeof value === 'string') {
      if (f.maxLength && value.length > f.maxLength) {
        issues.push({ key: f.key, label: f.label, message: `Máximo ${f.maxLength} caracteres.` });
      }
      if (f.minLength && value.trim().length < f.minLength) {
        issues.push({ key: f.key, label: f.label, message: 'Falta completarlo.' });
      }
    }
  }

  return issues;
}

/**
 * El backend concatena los errores del schema con `;` en un solo `message`.
 * Separarlos se lee mucho mejor que un párrafo corrido.
 */
export function splitBackendErrors(message: string): string[] {
  return message
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}
