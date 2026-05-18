export function formatCents(cents: number): number {
    return cents / 100;
}

export const formatBudget = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
