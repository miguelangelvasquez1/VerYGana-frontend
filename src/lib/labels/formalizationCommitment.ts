// Textos del bloque "Hoja Final de Aceptación Electrónica" del paso de aprobación del contrato
// (spec 015). Literales de la spec: no se resumen ni se reescriben. Ningún texto sugiere que el
// compromiso cambia la situación tributaria (RN-11). Sin 'use client' para poder probarlo.
export const FORMALIZATION_TEXTS = {
  title: 'Hoja Final de Aceptación Electrónica',
  subtitle: 'Apartado 9. Compromiso de crecimiento y formalización',
  versionLabel: (version: string) => `(versión ${version})`,
  checkboxLabel: 'Manifiesto expresamente este compromiso',
  refuseLink: 'No acepto este compromiso',
  fixedNote:
    'Aprobar el contrato no requiere marcar la casilla. Si no la marcas, VERYGANA te pedirá una aclaración. Este compromiso no cambia tu situación tributaria.',
  scrollRegionLabel: 'Texto del compromiso de formalización',
  scrollHint: 'Desplázate para leer el texto completo',
  loading: 'Cargando el compromiso…',
  loadError: 'No pudimos cargar el compromiso de formalización.',
  retry: 'Reintentar',
  loadErrorNote: 'Puedes aprobar tu contrato igual; VERYGANA te pedirá una aclaración después.',
  forbidden: 'No tienes permiso para ver esta información',
  refusedChip: 'No aceptado',
  undo: 'Deshacer',
  dialogTitle: '¿Confirmas que no aceptas este compromiso?',
  reasonLabel: 'Motivo',
  reasonOptional: '(opcional)',
  reasonCounter: (count: number) => `${count}/1000`,
  reasonMax: 'Máximo 1000 caracteres',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
  evidence: (date: string, version: string) =>
    `✓ Ya manifestaste este compromiso el ${date} (versión ${version})`,
  approveGenericError: 'No pudimos aprobar tu contrato. Intenta de nuevo',
} as const;
