// Orden ascendente de niveles para detectar subidas
const LEVEL_ORDER = ['BRONCE', 'PLATA', 'ORO', 'RUBI', 'ESMERALDA', 'DIAMANTE'];

/**
 * Compara el nivel previo (antes de ganar XP) con el nuevo para determinar
 * si hubo subida de nivel, y devuelve los campos que espera XpRewardToast.
 *
 * En un level-up, `currentLevel` es el nivel PREVIO (origen de la flecha en
 * la tarjeta "¡Subiste de nivel!") y `newLevel` es el nivel alcanzado.
 */
export function resolveLevelUp(prevLevel: string | undefined, newLevel: string) {
  const leveledUp = !!prevLevel
    && LEVEL_ORDER.indexOf(newLevel) > LEVEL_ORDER.indexOf(prevLevel);

  return {
    leveledUp,
    currentLevel: leveledUp ? prevLevel! : newLevel,
    newLevel: leveledUp ? newLevel : undefined,
  };
}
