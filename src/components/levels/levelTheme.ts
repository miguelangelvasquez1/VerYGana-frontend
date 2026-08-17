// ─────────────────────────────────────────────────────────────────────────────
// Tema visual de gamificación — paleta de marca VER Y GANAR
//
// Paleta base:
//   Azul oscuro      #0b1440
//   Azul medianoche  #03548C
//   Azul claro       #00a4ff  (gradiente → #0089d6)
//   Amarillo         #FFD700
//   Dorado           #c9a227
//
// Los niveles siguen una rampa cálida → fría: los primeros niveles usan el
// dorado/amarillo de la marca y los superiores los azules premium, de modo que
// "subir de nivel" se percibe como avanzar hacia el azul profundo (Diamante).
// El dorado se reserva como acento de recompensa del XP.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  azulOscuro:     '#0b1440',
  azulMedianoche: '#03548C',
  azulClaro:      '#00a4ff',
  azulClaroDark:  '#0089d6',
  amarillo:       '#FFD700',
  dorado:         '#c9a227',
  // Acentos de apoyo derivados
  xp:             '#c9a227', // color de recompensa (números "+XP")
  progreso:       '#00a4ff', // color de progreso / barras destacadas
} as const

export const LEVEL_ORDER = ['BRONCE', 'PLATA', 'ORO', 'RUBI', 'ESMERALDA', 'DIAMANTE'] as const

export type LevelKey = (typeof LEVEL_ORDER)[number]

export interface LevelTheme {
  label:  string
  accent: string          // color sólido para barras, íconos, bordes
  grad:   [string, string] // gradiente para superficies (hero, badges de nivel)
  soft:   string          // fondo pálido para chips / círculos de ícono
  on:     string          // texto legible sobre `soft` o blanco
  onGrad: string          // texto/ícono legible sobre el gradiente
}

// Cada nivel conserva su color característico (metal / gema) en una versión
// más elegante: tonos joya profundos y desaturados con gradientes nobles.
// Oro reutiliza el dorado de marca y Diamante el azul claro.
export const LEVEL_THEME: Record<string, LevelTheme> = {
  BRONCE:    { label: 'Bronce',    accent: '#C0803C', grad: ['#9A5C22', '#E0A15C'], soft: '#F8EFE0', on: '#8A551E', onGrad: '#FFFFFF' },
  PLATA:     { label: 'Plata',     accent: '#7E8B99', grad: ['#6B7885', '#B0BCC8'], soft: '#EEF1F4', on: '#455059', onGrad: '#FFFFFF' },
  ORO:       { label: 'Oro',       accent: '#C9A227', grad: ['#B0810E', '#F0C845'], soft: '#F9F1D8', on: '#6E5410', onGrad: '#4A3A00' },
  RUBI:      { label: 'Rubí',      accent: '#B31E48', grad: ['#8A1435', '#C63763'], soft: '#F9E6EC', on: '#7C1735', onGrad: '#FFFFFF' },
  ESMERALDA: { label: 'Esmeralda', accent: '#0F8A60', grad: ['#0B6A49', '#1CA87A'], soft: '#E2F3EC', on: '#0A5039', onGrad: '#FFFFFF' },
  DIAMANTE:  { label: 'Diamante',  accent: '#2E8FD4', grad: ['#2C6FAF', '#79C6F2'], soft: '#E8F3FC', on: '#1C5A8C', onGrad: '#FFFFFF' },
}

export const levelTheme = (level?: string): LevelTheme =>
  LEVEL_THEME[level ?? ''] ?? LEVEL_THEME.BRONCE

// Puente para superficies que usan la etiqueta en español (p. ej. tiers de
// referidos: "Bronce", "Rubí"…) → clave del tema.
export const LEVEL_BY_LABEL: Record<string, string> = {
  Bronce: 'BRONCE', Plata: 'PLATA', Oro: 'ORO',
  'Rubí': 'RUBI', Esmeralda: 'ESMERALDA', Diamante: 'DIAMANTE',
}

export const tierTheme = (label?: string): LevelTheme =>
  levelTheme(LEVEL_BY_LABEL[label ?? ''])

// CSS `linear-gradient(...)` listo para inline styles
export const levelGradient = (level?: string, angle = 135): string => {
  const t = levelTheme(level)
  return `linear-gradient(${angle}deg, ${t.grad[0]}, ${t.grad[1]})`
}

// Superficie con "sheen" — reflejo especular sobre el gradiente base, para que
// el metal/gema se lea pulido y con volumen en lugar de un color plano.
export const levelSheen = (level?: string, angle = 135): string => {
  const t = levelTheme(level)
  return [
    'linear-gradient(120deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.14) 100%)',
    `linear-gradient(${angle}deg, ${t.grad[0]}, ${t.grad[1]})`,
  ].join(', ')
}

// Sombra interior de bisel para medallones (borde luminoso arriba, oscuro abajo)
export const MEDALLION_BEVEL =
  'inset 0 1px 1px rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.22)'

// ─── Actividades (fuentes de XP) — unificadas a azul + dorado ─────────────────

export interface ActivityTheme {
  label: string
  color: string // ícono / texto de acento
  bg:    string // fondo pálido del círculo de ícono
}

export const ACTIVITY_THEME: Record<string, ActivityTheme> = {
  SURVEY_COMPLETED: { label: 'Encuesta completada', color: '#03548C', bg: '#E6EEF6' },
  VIDEO_WATCHED:    { label: 'Video visto',          color: '#0089D6', bg: '#E1F2FC' },
  GAME_PLAYED:      { label: 'Partida jugada',       color: '#0B1440', bg: '#E6E9F2' },
  REFERRAL_ACTIVE:  { label: 'Referido activo',      color: '#C9A227', bg: '#F7EFD6' },
  PURCHASE:         { label: 'Compra realizada',     color: '#B98D12', bg: '#FBF4D6' },
}

export const activityTheme = (type?: string): ActivityTheme =>
  ACTIVITY_THEME[type ?? ''] ?? ACTIVITY_THEME.SURVEY_COMPLETED
