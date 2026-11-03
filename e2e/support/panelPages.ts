import type { TestRole } from './session';
import { COMMERCIAL_ID } from './pages';

// Las páginas de la spec 014 con la URL que se abre en las pruebas de navegador: las 9 públicas y de
// autenticación que no son de la 012 (B, solo 6 aquí; `/login`, `/register` y `/verify` ya los mide la 012)
// y las 54 de los paneles de comercial, admin y cumplimiento (C).
// Los ids de detalle salen de los fixtures de `e2e/fixtures/api`. El id reservado 999 hace que la API
// simulada responda 500 (estado de error). Todo son datos ficticios (P-16).

/** Plan efectivo del comercial que devuelve `GET /plans/commercial/state` (fixture `plans/commercial-state-*`). */
export type TestPlan = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface PanelVariant {
  /** Nombre corto, único dentro de la página; va en el título de la prueba. */
  name: string;
  /** Plan del comercial con el que se abre; por defecto, el de la página. */
  plan?: TestPlan;
  /** Respuestas distintas a las de la página: patrón glob sobre el pedido → fixture (ruta relativa a `e2e/fixtures`). */
  fixtures?: Record<string, string>;
  /** Botones que se tocan, por nombre accesible y en orden, antes de medir (pestañas, secciones). */
  click?: string[];
  /** Texto que prueba que la variante cargó (la prueba lo espera en vez de la red inactiva, R-6). */
  expectText?: string;
}

export interface PanelPage {
  /** Ruta tal como está en el plan (sirve para filtrar con `-g`). */
  route: string;
  /** URL que se abre. */
  url: string;
  /** Rol de la sesión; `null` en las públicas (sin cookie). */
  role: TestRole | null;
  /** Plan del comercial; por defecto `STANDARD` (el fixture de la 012). */
  plan?: TestPlan;
  /** Estados distintos de la misma página que también se miden. */
  variants?: PanelVariant[];
  /**
   * Pedidos a la API simulada (patrones glob sobre su origen) que se responden con 500 para ver el estado
   * de error a 360 px. Vacío: la página no tiene un estado de error propio que mostrar.
   */
  errorApi: string[];
  /** Para páginas cuyo detalle se pide con un id: la URL con el id reservado 999 (500). */
  errorUrl?: string;
  /** Si la página no se queda: la ruta a la que termina (por ejemplo, `/compliance` redirige a KYC). */
  redirectsTo?: string;
  /** Texto que prueba que la página cargó (la prueba lo espera en vez de la red inactiva, R-6). */
  expectText?: string;
  /** Siembra `sessionStorage` antes de que cargue la página (por ejemplo, la referencia de pago ficticia). */
  sessionStorage?: Record<string, string>;
}

const COMMERCIAL: TestRole = 'ROLE_COMMERCIAL';
const ADMIN: TestRole = 'ROLE_ADMIN';
const COMPLIANCE: TestRole = 'ROLE_COMPLIANCE_OFFICER';

/** `publicId` del reconocimiento de los fixtures de admin. */
export const RECOGNITION_ID = '00000000-0000-4000-8000-0000000000e1';

/** Los siete pasos del asistente de onboarding: el `currentStep` que devuelve `GET /commercials/onboarding/status`. */
export const ONBOARDING_STEPS = [
  { name: 'paso 1 · términos', step: 'TERMS_PENDING' },
  { name: 'paso 2 · identificación legal', step: 'LEGAL_IDENTIFICATION_PENDING' },
  { name: 'paso 3 · diagnóstico', step: 'DIAGNOSTIC_PENDING' },
  { name: 'paso 4 · plan', step: 'PLAN_PENDING' },
  { name: 'paso 5 · documentos', step: 'DOCUMENTS_PENDING' },
  { name: 'paso 6 · contrato', step: 'CONTRACT_PENDING' },
  { name: 'paso 7 · pago', step: 'PAYMENT_PENDING' },
] as const;

/** Fixture del estado del onboarding para un paso. */
export const onboardingFixture = (step: (typeof ONBOARDING_STEPS)[number]['step']) =>
  `api/onboarding/status-${step}.json`;

export const PUBLIC_PAGES: PanelPage[] = [
  { route: '/forgot-password', url: '/forgot-password', role: null, errorApi: [] },
  { route: '/unlock-account', url: '/unlock-account?identifier=consumidor%40example.test', role: null, errorApi: [] },
  { route: '/terminos', url: '/terminos', role: null, errorApi: [] },
  {
    route: '/commercial-onboarding',
    url: '/commercial-onboarding',
    role: COMMERCIAL,
    // El paso 1 es la página base (fixture `status-TERMS_PENDING`); los otros seis son variantes.
    variants: [
      ...ONBOARDING_STEPS.slice(1).map(({ name, step }) => ({
        name,
        fixtures: { '**/commercials/onboarding/status': onboardingFixture(step) },
      })),
      // Resultado del diagnóstico: "Comparar modalidades" abre la comparación y el modal de detalle del plan.
      {
        name: 'paso 3 · resultado',
        fixtures: { '**/commercials/onboarding/status': 'api/onboarding/status-CLASSIFICATION_PENDING.json' },
      },
    ],
    errorApi: ['**/commercials/onboarding/status'],
  },
  {
    route: '/plans',
    url: '/plans',
    role: COMMERCIAL,
    variants: [{ name: 'comparar planes', click: ['Comparar planes'] }],
    errorApi: ['**/plans/catalog'],
  },
  {
    route: '/plans/checkout',
    url: '/plans/checkout',
    role: COMMERCIAL,
    // La referencia de pago es ficticia y no es una credencial (P-16).
    sessionStorage: { vg_payment_reference: 'ref-ficticia-0001' },
    expectText: '¡Pago exitoso!',
    variants: [
      {
        name: 'pago rechazado',
        fixtures: { '**/plans/status/*': 'api/plans/status-declined.json' },
        expectText: 'Pago rechazado',
      },
    ],
    errorApi: ['**/plans/status/*'],
  },
];

export const COMMERCIAL_PAGES: PanelPage[] = [
  {
    route: '/commercial',
    url: '/commercial',
    role: COMMERCIAL,
    errorApi: [],
    redirectsTo: '/commercial/dashboard',
  },
  {
    route: '/commercial/dashboard',
    url: '/commercial/dashboard',
    role: COMMERCIAL,
    variants: [
      { name: 'saldo agotado', fixtures: { '**/plans/commercial/state': 'api/plans/commercial-state-exhausted.json' } },
      { name: 'saldo dormido', fixtures: { '**/plans/commercial/state': 'api/plans/commercial-state-dormant.json' } },
    ],
    errorApi: ['**/commercial/dashboard/summary*'],
  },
  { route: '/commercial/analytics', url: '/commercial/analytics', role: COMMERCIAL, errorApi: [] },
  { route: '/commercial/billing', url: '/commercial/billing', role: COMMERCIAL, errorApi: ['**/commercial/wallet/me/billing-summary'] },
  { route: '/commercial/balance', url: '/commercial/balance', role: COMMERCIAL, errorApi: ['**/plans/recharge/current'] },
  { route: '/commercial/plan-change', url: '/commercial/plan-change', role: COMMERCIAL, errorApi: ['**/plans/change-request/current'] },
  { route: '/commercial/prosperity', url: '/commercial/prosperity', role: COMMERCIAL, errorApi: ['**/commercial/prosperity/movements*'] },
  { route: '/commercial/key-promotions', url: '/commercial/key-promotions', role: COMMERCIAL, errorApi: ['**/commercial/key-promotions/offers'] },
  {
    route: '/commercial/ads',
    url: '/commercial/ads',
    role: COMMERCIAL,
    // `LockedPage`: el plan `BASIC` no alcanza esta sección.
    variants: [{ name: 'página bloqueada', plan: 'BASIC', expectText: 'Sección no disponible' }],
    errorApi: ['**/ads/my-ads/filter*'],
  },
  { route: '/commercial/ads/create', url: '/commercial/ads/create', role: COMMERCIAL, errorApi: [] },
  { route: '/commercial/surveys', url: '/commercial/surveys', role: COMMERCIAL, errorApi: ['**/surveys/commercial*'] },
  { route: '/commercial/surveys/new', url: '/commercial/surveys/new', role: COMMERCIAL, errorApi: [] },
  {
    route: '/commercial/surveys/[surveyId]',
    url: '/commercial/surveys/1',
    role: COMMERCIAL,
    errorApi: [],
    errorUrl: '/commercial/surveys/999',
  },
  { route: '/commercial/products', url: '/commercial/products', role: COMMERCIAL, errorApi: ['**/products/my-products*'] },
  { route: '/commercial/products/create', url: '/commercial/products/create', role: COMMERCIAL, errorApi: [] },
  {
    route: '/commercial/products/[id]',
    url: '/commercial/products/1',
    role: COMMERCIAL,
    errorApi: [],
    errorUrl: '/commercial/products/999',
  },
  {
    route: '/commercial/products/edit/[productId]',
    url: '/commercial/products/edit/1',
    role: COMMERCIAL,
    errorApi: [],
    errorUrl: '/commercial/products/edit/999',
  },
  { route: '/commercial/branding', url: '/commercial/branding', role: COMMERCIAL, errorApi: ['**/campaigns'] },
  {
    route: '/commercial/branding/campaigns/[id]',
    url: '/commercial/branding/campaigns/1',
    role: COMMERCIAL,
    errorApi: [],
    errorUrl: '/commercial/branding/campaigns/999',
  },
  { route: '/commercial/branding/requests', url: '/commercial/branding/requests', role: COMMERCIAL, errorApi: ['**/branding-requests'] },
  {
    route: '/commercial/branding/requests/[id]',
    url: '/commercial/branding/requests/1',
    role: COMMERCIAL,
    variants: [
      { name: 'borrador', fixtures: { '**/branding-requests/1': 'api/branding-requests/detail-draft.json' }, expectText: 'Enviar al equipo de revisión' },
      {
        name: 'pendiente de tu aprobación',
        fixtures: { '**/branding-requests/1': 'api/branding-requests/detail-pending-approval.json' },
        expectText: 'El diseñador completó la integración de tu marca',
      },
      { name: 'rechazada', fixtures: { '**/branding-requests/1': 'api/branding-requests/detail-rejected.json' }, expectText: 'Marca de Prueba' },
    ],
    errorApi: [],
    errorUrl: '/commercial/branding/requests/999',
  },
  // Solo el plan Premium las alcanza.
  { route: '/commercial/pets', url: '/commercial/pets', role: COMMERCIAL, plan: 'PREMIUM', errorApi: ['**/commercial/pet/requests'] },
  { route: '/commercial/allies', url: '/commercial/allies', role: COMMERCIAL, plan: 'PREMIUM', errorApi: ['**/commercial/allies'] },
  {
    route: '/commercial/allies/[id]',
    url: `/commercial/allies/${COMMERCIAL_ID}`,
    role: COMMERCIAL,
    plan: 'PREMIUM',
    errorApi: [],
    errorUrl: '/commercial/allies/999',
  },
  { route: '/commercial/profile', url: '/commercial/profile', role: COMMERCIAL, errorApi: ['**/commercials/profile'] },
  { route: '/commercial/profile/edit', url: '/commercial/profile/edit', role: COMMERCIAL, errorApi: ['**/commercials/profile'] },
  { route: '/commercial/support', url: '/commercial/support', role: COMMERCIAL, errorApi: ['**/pqrs/mine*'] },
];

export const ADMIN_PAGES: PanelPage[] = [
  { route: '/admin', url: '/admin', role: ADMIN, errorApi: [] },
  { route: '/admin/system', url: '/admin/system', role: ADMIN, errorApi: [] },
  { route: '/admin/users', url: '/admin/users', role: ADMIN, errorApi: ['**/admin/users/consumers*'] },
  {
    route: '/admin/pqrs',
    url: '/admin/pqrs',
    role: ADMIN,
    variants: [
      { name: 'reembolsos', click: ['Reembolsos'] },
      { name: 'métodos de pago', click: ['Métodos de pago'] },
    ],
    errorApi: ['**/admin/pqrs*'],
  },
  { route: '/admin/ads', url: '/admin/ads', role: ADMIN, errorApi: ['**/ads/admin/all*'] },
  { route: '/admin/branding', url: '/admin/branding', role: ADMIN, errorApi: ['**/api/admin/branding-requests'] },
  { route: '/admin/pet-requests', url: '/admin/pet-requests', role: ADMIN, errorApi: ['**/api/admin/pet-requests*'] },
  { route: '/admin/products', url: '/admin/products', role: ADMIN, errorApi: ['**/admin/products*'] },
  { route: '/admin/raffles', url: '/admin/raffles', role: ADMIN, errorApi: ['**/api/raffles*'] },
  {
    route: '/admin/raffles/[id]',
    url: '/admin/raffles/1',
    role: ADMIN,
    errorApi: [],
    errorUrl: '/admin/raffles/999',
  },
  { route: '/admin/surveys', url: '/admin/surveys', role: ADMIN, errorApi: ['**/surveys/admin*'] },
  {
    route: '/admin/surveys/[surveyId]',
    url: '/admin/surveys/1',
    role: ADMIN,
    errorApi: [],
    errorUrl: '/admin/surveys/999',
  },
  { route: '/admin/forum', url: '/admin/forum', role: ADMIN, errorApi: ['**/impact-stories*'] },
  { route: '/admin/finance', url: '/admin/finance', role: ADMIN, errorApi: ['**/admin/treasury/balance'] },
  { route: '/admin/key-promotions', url: '/admin/key-promotions', role: ADMIN, errorApi: ['**/admin/key-promotions*'] },
  {
    route: '/admin/key-promotions/[id]',
    url: '/admin/key-promotions/1',
    role: ADMIN,
    errorApi: [],
    errorUrl: '/admin/key-promotions/999',
  },
  { route: '/admin/recognitions', url: '/admin/recognitions', role: ADMIN, errorApi: ['**/admin/recognitions*'] },
  { route: '/admin/recognitions/new', url: '/admin/recognitions/new', role: ADMIN, errorApi: ['**/admin/recognitions/candidates*'] },
  {
    route: '/admin/recognitions/[publicId]',
    url: `/admin/recognitions/${RECOGNITION_ID}`,
    role: ADMIN,
    errorApi: [],
    errorUrl: '/admin/recognitions/999',
  },
  { route: '/admin/security-events', url: '/admin/security-events', role: ADMIN, errorApi: ['**/admin/security-events*'] },
  { route: '/admin/config', url: '/admin/config', role: ADMIN, errorApi: ['**/system-features'] },
];

export const COMPLIANCE_PAGES: PanelPage[] = [
  // `/compliance` no tiene pantalla propia: redirige a KYC. Se comprueba el destino, no se mide dos veces.
  { route: '/compliance', url: '/compliance', role: COMPLIANCE, errorApi: [], redirectsTo: '/compliance/kyc' },
  { route: '/compliance/kyc', url: '/compliance/kyc', role: COMPLIANCE, errorApi: ['**/compliance/kyc/pending'] },
  { route: '/compliance/screenings', url: '/compliance/screenings', role: COMPLIANCE, errorApi: ['**/compliance/screenings/hits*'] },
  { route: '/compliance/contracts', url: '/compliance/contracts', role: COMPLIANCE, errorApi: ['**/compliance/contracts*'] },
  { route: '/compliance/plan-changes', url: '/compliance/plan-changes', role: COMPLIANCE, errorApi: ['**/compliance/plan-changes'] },
  { route: '/compliance/audit-logs', url: '/compliance/audit-logs', role: COMPLIANCE, errorApi: ['**/compliance/audit-logs*'] },
];

/** Todas las páginas de B (las que no son de la 012) y C. */
export const PANEL_PAGES: PanelPage[] = [...PUBLIC_PAGES, ...COMMERCIAL_PAGES, ...ADMIN_PAGES, ...COMPLIANCE_PAGES];
