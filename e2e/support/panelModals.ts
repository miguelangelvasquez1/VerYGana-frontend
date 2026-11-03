// Inventario de los modales de los paneles que `e2e/panels/modals.spec.ts` abre y mide a 360 px (spec 014,
// CA-9, plan 2.5). La sesión, el plan y las respuestas simuladas salen de la entrada de `panelPages.ts` de la
// página en que vive el modal. Si un modal no se puede abrir con los fixtures, va con `manualOnly` y su
// motivo (D-7) y se comprueba a mano en la pasada de CA-13.
//
// Hecho a mano y con una pasada que hizo clic en cada botón de cada página con los fixtures de T5. Las tareas
// de cada panel (T17-T33) agregan aquí los modales que toquen y no estén todavía (por ejemplo, los que se abren
// desde una fila con botones de solo ícono).

export interface PanelModal {
  /** Identificador estable: va en el título de la prueba y en `pending.ts`. */
  id: string;
  /** Ruta de la página en `panelPages.ts`. */
  page: string;
  /** Variante de la página (por nombre) con la que se abre, si hace falta. */
  variant?: string;
  /** Botones que se tocan, por nombre accesible y en orden, para abrirlo. */
  open: string[];
  /** Si el nombre debe coincidir exacto (por defecto sí). */
  exact?: boolean;
  /** Nombre accesible del botón que lo cierra. */
  close: string;
  /** Motivo por el que no se abre con fixtures (D-7). La prueba se omite y queda para CA-13. */
  manualOnly?: string;
}

export const PANEL_MODALS: PanelModal[] = [
  // Comercial
  { id: 'commercial-billing-new-payout', page: '/commercial/billing', open: ['Agregar método de pago'], close: 'Cerrar' },
  { id: 'commercial-billing-verify-otp', page: '/commercial/billing', open: ['Verificar código'], close: 'Cerrar' },
  { id: 'commercial-ads-increase-budget', page: '/commercial/ads', open: ['Aumentar presupuesto'], close: 'Cerrar' },
  { id: 'commercial-ads-detail', page: '/commercial/ads', open: ['Ver detalles'], close: 'Cerrar' },
  { id: 'commercial-ads-edit', page: '/commercial/ads', open: ['Editar'], close: 'Cerrar' },
  { id: 'commercial-surveys-detail', page: '/commercial/surveys', open: ['Ver detalle'], close: 'Cerrar' },
  { id: 'commercial-surveys-edit', page: '/commercial/surveys', open: ['Ver detalle', 'Editar encuesta'], close: 'Cerrar' },
  { id: 'commercial-products-card-help', page: '/commercial/products', open: ['Ayuda'], close: 'Cerrar' },
  { id: 'commercial-branding-game-preview', page: '/commercial/branding/requests', open: ['Nueva solicitud', 'Ver'], close: 'Cerrar' },
  { id: 'commercial-branding-approve-design', page: '/commercial/branding/requests/[id]', variant: 'pendiente de tu aprobación', open: ['Aprobar diseño'], close: 'Cerrar' },
  { id: 'commercial-branding-request-changes', page: '/commercial/branding/requests/[id]', variant: 'pendiente de tu aprobación', open: ['Solicitar cambios'], close: 'Cerrar' },
  { id: 'commercial-branding-cancel-request', page: '/commercial/branding/requests/[id]', variant: 'borrador', open: ['Cancelar solicitud'], close: 'Cerrar' },
  { id: 'commercial-campaign-increase-budget', page: '/commercial/branding/campaigns/[id]', open: ['Aumentar presupuesto'], close: 'Cerrar' },
  { id: 'commercial-pets-new-request', page: '/commercial/pets', open: ['Nueva solicitud'], close: 'Cerrar' },
  { id: 'commercial-support-new-pqrs', page: '/commercial/support', open: ['Nueva solicitud'], close: 'Cerrar' },
  { id: 'onboarding-plan-detail', page: '/commercial-onboarding', variant: 'paso 3 · resultado', open: ['Comparar modalidades', 'Ver detalle del plan'], close: 'Cerrar' },
  { id: 'plans-change-plan', page: '/plans', open: ['Cambiar de plan'], close: 'Cerrar' },

  // Administración
  { id: 'admin-ads-approve', page: '/admin/ads', open: ['Aprobar'], close: 'Cancelar' },
  { id: 'admin-ads-block', page: '/admin/ads', open: ['Bloquear'], close: 'Cancelar' },
  { id: 'admin-ads-reject', page: '/admin/ads', open: ['Rechazar'], close: 'Cancelar' },
  { id: 'admin-ads-detail', page: '/admin/ads', open: ['Ver detalle completo'], close: 'Cerrar' },
  { id: 'admin-finance-expire-keys', page: '/admin/finance', open: ['Ejecutar vencimiento'], close: 'Cancelar' },
  { id: 'admin-key-promotions-new', page: '/admin/key-promotions', open: ['Nueva promoción'], close: 'Cerrar' },
  { id: 'admin-key-promotion-pause', page: '/admin/key-promotions/[id]', open: ['Pausar'], close: 'Cancelar' },
  { id: 'admin-key-promotion-end', page: '/admin/key-promotions/[id]', open: ['Cerrar'], close: 'Cancelar' },
  { id: 'admin-raffle-cancel', page: '/admin/raffles/[id]', open: ['Cancelar'], close: 'Volver' },
  { id: 'admin-raffle-close', page: '/admin/raffles/[id]', open: ['Cerrar'], close: 'Volver' },
  { id: 'admin-raffle-edit', page: '/admin/raffles/[id]', open: ['Editar'], close: 'Cerrar edición' },
  { id: 'admin-recognition-cancel', page: '/admin/recognitions/[publicId]', open: ['Anular'], close: 'Cerrar' },
  { id: 'admin-recognition-user', page: '/admin/recognitions/[publicId]', open: ['Ver usuario'], close: 'Cerrar' },
  { id: 'admin-surveys-suspend', page: '/admin/surveys', open: ['Suspender'], close: 'Cancelar' },
  { id: 'admin-users-new-designer', page: '/admin/users', open: ['Registrar Game Designer'], close: 'Cancelar' },
  { id: 'admin-users-new-officer', page: '/admin/users', open: ['Registrar Oficial de Cumplimiento'], close: 'Cancelar' },
  { id: 'admin-users-detail', page: '/admin/users', open: ['Ver detalle'], close: 'Cerrar' },
  { id: 'admin-users-edit', page: '/admin/users', open: ['Editar'], close: 'Cancelar' },
  { id: 'admin-users-notify', page: '/admin/users', open: ['Enviar notificación'], close: 'Cancelar' },
  // T29 a T31: los que se abren desde una lista con fixtures.
  { id: 'admin-raffles-create', page: '/admin/raffles', open: ['Crear Rifa'], close: 'Cerrar creación' },
  { id: 'admin-raffles-delete', page: '/admin/raffles', open: ['Eliminar rifa'], close: 'Cancelar' },
  { id: 'admin-ticket-rule-new', page: '/admin/raffles', open: ['Reglas de boletos', 'Crear Regla'], close: 'Cerrar' },
  { id: 'admin-ticket-rule-delete', page: '/admin/raffles', open: ['Reglas de boletos', 'Eliminar'], close: 'Cancelar' },
  { id: 'admin-surveys-reject', page: '/admin/surveys', open: ['Rechazar encuesta'], close: 'Cancelar' },
  { id: 'admin-config-legal-history', page: '/admin/config', open: ['Documentos Legales', 'Historial'], close: 'Cerrar' },
  { id: 'admin-config-legal-publish', page: '/admin/config', open: ['Documentos Legales', 'Publicar'], close: 'Cerrar' },
  { id: 'admin-products-detail', page: '/admin/products', open: ['Producto de prueba 1'], close: 'Cerrar' },
  { id: 'admin-products-approve', page: '/admin/products', open: ['Aprobar'], close: 'Cerrar' },
  { id: 'admin-forum-delete', page: '/admin/forum', open: ['Eliminar'], close: 'Cancelar' },
  { id: 'admin-config-price-edit', page: '/admin/config', open: ['Precios', 'Editar'], close: 'Cerrar' },
  { id: 'admin-users-block', page: '/admin/users', open: ['Bloquear'], close: 'Cancelar' },

  // Cumplimiento
  { id: 'compliance-kyc-reject', page: '/compliance/kyc', open: ['Rechazar'], close: 'Cancelar' },
  { id: 'compliance-kyc-screening', page: '/compliance/kyc', open: ['Screening'], close: 'Cerrar' },
  { id: 'compliance-screenings-review', page: '/compliance/screenings', open: ['Revisar'], close: 'Cancelar' },
  { id: 'compliance-contracts-review', page: '/compliance/contracts', open: ['Revisar'], close: 'Cerrar' },
  { id: 'compliance-plan-changes-review', page: '/compliance/plan-changes', open: ['Revisar'], close: 'Cerrar' },

  // Solo manual (D-7) de admin (T29 a T31):
  { id: 'admin-key-promotion-edit', page: '/admin/key-promotions/[id]', open: [], close: 'Cerrar', manualOnly: 'el botón "Editar" solo aparece en una promoción en borrador y el fixture del detalle es el de una promoción activa' },
  { id: 'admin-config-system-confirm', page: '/admin/config', open: [], close: 'Cancelar', manualOnly: 'se abre cambiando el estado de un módulo en un `select`, no con un botón con nombre' },
  { id: 'admin-branding-detail-modals', page: '/admin/branding', open: [], close: 'Cerrar', manualOnly: 'aprobar, rechazar y reasignar se abren desde el detalle de una solicitud, al que se entra con un clic en la fila de la tabla (no es un botón) y el detalle de administración no tiene fixture' },
  { id: 'admin-prosperity-modals', page: '/admin/config', open: [], close: 'Cerrar', manualOnly: 'los modales de ajuste y de reversión de umbral salen en el libro de prosperidad de un comercial seleccionado, que no tiene fixture' },

  // Solo manual (D-7): dependen de una respuesta de la API que no se puede dejar fija sin romper otras pantallas
  // o de un servicio externo.
  { id: 'payment-required', page: '/commercial/ads', open: [], close: 'Cerrar', manualOnly: 'lo abre el interceptor global ante un 402 de la API (recarga de billetera); sirve el mismo fixture a toda la página' },
  { id: 'plan-change-blocked', page: '/commercial/plan-change', open: [], close: 'Cerrar', manualOnly: 'lo abre un 400 de bloqueo por cambio de plan al pedir el cambio' },
  { id: 'commercial-analytics-monthly-report', page: '/commercial/analytics', open: [], close: 'Cerrar', manualOnly: 'se abre tocando una barra del gráfico de ganancias por mes (recharts), que no es un control con nombre accesible' },
  { id: 'commercial-ads-media-preview', page: '/commercial/ads', open: [], close: 'Cerrar', manualOnly: 'se abre tocando la imagen del anuncio, que no es un control con nombre accesible' },
  { id: 'commercial-balance-cancel-recharge', page: '/commercial/balance', open: [], close: 'Cancelar', manualOnly: 'pide una recarga en curso (WizardConfirmModal de cancelación): el fixture de /plans/recharge/current es el de una sin recarga' },
  { id: 'claim-pin', page: '/commercial/products', open: [], close: 'Cerrar', manualOnly: 'necesita un cobro pendiente de un consumidor real (PIN de reclamo)' },
  { id: 'onboarding-rejection', page: '/commercial-onboarding', open: [], close: 'Cerrar', manualOnly: 'sale una sola vez por cada rechazo nuevo (compara `rejectedAt` con localStorage)' },
  { id: 'wompi-checkout', page: '/plans', open: [], close: 'Cerrar', manualOnly: 'redirige al checkout de Wompi, un servicio externo' },
];
