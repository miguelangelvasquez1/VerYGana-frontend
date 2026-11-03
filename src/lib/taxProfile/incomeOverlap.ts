export interface IncomeRowLike {
  concept?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
}

const CONSOLIDATED = 'CONSOLIDATED_INCLUDES_PLATFORM';

// Índices de las filas que chocan (misma regla que la API, RN-10): mismo concepto, periodos que
// se cruzan con los extremos incluidos, y alcance igual o uno de ellos "Total que ya incluye
// VERYGANA". Las filas incompletas se ignoran. Las fechas son AAAA-MM-DD y se comparan como texto.
export function findIncomeOverlaps(rows: IncomeRowLike[]): Set<number> {
  const clashing = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    if (!a.concept || !a.scope || !a.periodStart || !a.periodEnd) continue;
    for (let j = i + 1; j < rows.length; j++) {
      const b = rows[j];
      if (!b.concept || !b.scope || !b.periodStart || !b.periodEnd) continue;
      if (a.concept !== b.concept) continue;
      const cross = a.periodStart <= b.periodEnd && b.periodStart <= a.periodEnd;
      if (!cross) continue;
      if (a.scope === b.scope || a.scope === CONSOLIDATED || b.scope === CONSOLIDATED) {
        clashing.add(i);
        clashing.add(j);
      }
    }
  }
  return clashing;
}
