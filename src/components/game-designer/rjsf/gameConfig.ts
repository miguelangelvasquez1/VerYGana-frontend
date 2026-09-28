import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';

/**
 * Aplana los valores del AssetWidget de `{ assetId, url }` a la URL pelada.
 *
 * Es el mismo aplanado que hace el backend en `stripAssetMetadata` antes de
 * validar y de guardar. Tiene que ser idéntico: el schema declara los assets como
 * string, así que validar el formData crudo reportaría un error de tipo en cada
 * asset subido.
 */
function stripAssetMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAssetMetadata);

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('assetId' in obj && 'url' in obj) return obj.url;

    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stripAssetMetadata(v)]),
    );
  }

  return value;
}

/** Un error listo para mostrarle al diseñador: dónde y qué. */
export interface GameConfigError {
  path: string;
  message: string;
}

/**
 * Valida la config contra el schema del juego, igual que el backend.
 *
 * Existe porque el envío no comprobaba nada: el `<Form>` se monta sin botón de
 * submit propio, así que la validación de RJSF nunca corría y el diseñador podía
 * entregar un diseño con campos fuera de rango o assets sin subir. El síntoma
 * aparecía después, dentro del juego y sin ningún error visible.
 */
export function validateGameConfig(
  gameConfig: Record<string, unknown>,
  schema: RJSFSchema,
): GameConfigError[] {
  const flattened = stripAssetMetadata(gameConfig) as Record<string, unknown>;
  // Contra el mismo schema que se dibuja: los bloques que sella el backend no los
  // llena el diseñador, así que exigírselos acá sería un error que no puede corregir.
  const { errors } = validator.validateFormData(flattened, withoutBackendManaged(schema));

  return errors.map((error) => {
    const path = (error.property ?? '').replace(/^\./, '');

    // En un campo de asset el mensaje crudo de ajv ("must match format uri")
    // no le dice nada a un diseñador.
    const isAssetField = /_url$|Url$|^url/.test(path.split('.').pop() ?? '');
    const message =
      isAssetField && (error.name === 'format' || error.name === 'type')
        ? 'Falta subir el archivo'
        : error.message ?? 'valor inválido';

    return { path: path || '(raíz)', message };
  });
}

/**
 * Bloques que sella el backend y el diseñador no debe tocar.
 *
 * - `meta` — `brand_id` y `campaign_id` identifican marca y campaña para la
 *   telemetría del build. Son datos que el backend ya conoce, y pedírselos al
 *   diseñador solo producía basura: en una solicitud real quedaron como "Brand-id"
 *   y "brand id".
 * - `personalization` — el icono de moneda/llave es el mismo en todas las campañas
 *   (solo lo declaran los juegos de cali). Pedirlo en cada brandeo era trabajo
 *   repetido y una oportunidad más de que la campaña saliera con el placeholder.
 *
 * Se sellan en la entrega y en cada lectura.
 */
const BACKEND_MANAGED_BLOCKS = ['meta', 'personalization'];

/** El schema sin los bloques que sella el backend. */
export function withoutBackendManaged(schema: RJSFSchema): RJSFSchema {
  const properties = { ...(schema.properties ?? {}) };
  BACKEND_MANAGED_BLOCKS.forEach(block => delete properties[block]);

  return {
    ...schema,
    properties,
    // También de `required`, o el formulario exigiría un bloque que ya no dibuja.
    required: (schema.required ?? []).filter(k => !BACKEND_MANAGED_BLOCKS.includes(k)),
  };
}

/** El uiSchema equivalente. RJSF falla si `ui:order` nombra una propiedad ausente. */
export function withoutBackendManagedUi(
  uiSchema: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!uiSchema) return uiSchema;

  const next = { ...uiSchema };
  BACKEND_MANAGED_BLOCKS.forEach(block => delete next[block]);

  const order = next['ui:order'];
  if (Array.isArray(order)) {
    next['ui:order'] = order.filter(k => !BACKEND_MANAGED_BLOCKS.includes(k as string));
  }

  return next;
}
