// Colombia (America/Bogota) vive en UTC-5 todo el año, sin horario de
// verano, así que el offset se puede tratar como constante sin depender de
// Intl/timezone databases.
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;
const PAYOUT_HOUR_COT = 23;

/**
 * Calcula el corte para reportar un problema: las 11 PM (hora Colombia)
 * siguientes a la entrega, que es cuando corren los payouts diarios. Si el
 * producto se entregó después de las 11 PM de su día, el corte pasa al día
 * siguiente.
 */
export const getReportDeadline = (deliveredAt: string | Date): Date => {
  const delivered = typeof deliveredAt === "string" ? new Date(deliveredAt) : deliveredAt;
  const cotShifted = new Date(delivered.getTime() - COLOMBIA_OFFSET_MS);

  const deadlineShifted = new Date(
    Date.UTC(cotShifted.getUTCFullYear(), cotShifted.getUTCMonth(), cotShifted.getUTCDate(), PAYOUT_HOUR_COT, 0, 0, 0)
  );

  if (deadlineShifted.getTime() <= cotShifted.getTime()) {
    deadlineShifted.setUTCDate(deadlineShifted.getUTCDate() + 1);
  }

  return new Date(deadlineShifted.getTime() + COLOMBIA_OFFSET_MS);
};

export const getMsUntilReportDeadline = (deliveredAt: string | Date, now: Date = new Date()): number =>
  getReportDeadline(deliveredAt).getTime() - now.getTime();

export const isReportDeadlinePassed = (deliveredAt: string | Date, now: Date = new Date()): boolean =>
  getMsUntilReportDeadline(deliveredAt, now) <= 0;

export const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
