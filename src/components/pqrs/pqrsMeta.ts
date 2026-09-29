import { MarketPlaceIssueReason, PqrsResolutionAction, PqrsStatus, PqrsType } from "@/types/Pqrs.types";

export const pqrsTypeLabel: Record<PqrsType, string> = {
  [PqrsType.PETICION]: "Petición",
  [PqrsType.QUEJA]: "Queja",
  [PqrsType.RECLAMO]: "Reclamo",
  [PqrsType.SUGERENCIA]: "Sugerencia",
};

export const pqrsStatusLabel: Record<PqrsStatus, string> = {
  [PqrsStatus.PENDIENTE_ASIGNACION]: "Pendiente de asignación",
  [PqrsStatus.RECIBIDA]: "Recibida",
  [PqrsStatus.EN_REVISION]: "En revisión",
  [PqrsStatus.PENDIENTE_PAGO_REEMBOLSO]: "Esperando pago del reembolso",
  [PqrsStatus.RESUELTA]: "Resuelta",
  [PqrsStatus.CERRADA]: "Cerrada",
};

export const pqrsStatusColor: Record<PqrsStatus, string> = {
  [PqrsStatus.PENDIENTE_ASIGNACION]: "text-amber-600 bg-amber-50",
  [PqrsStatus.RECIBIDA]: "text-admin-midnight bg-admin-midnight/10",
  [PqrsStatus.EN_REVISION]: "text-admin-blue bg-admin-blue/10",
  [PqrsStatus.PENDIENTE_PAGO_REEMBOLSO]: "text-teal-600 bg-teal-50",
  [PqrsStatus.RESUELTA]: "text-green-600 bg-green-50",
  [PqrsStatus.CERRADA]: "text-gray-600 bg-gray-100",
};

export const pqrsStatusDot: Record<PqrsStatus, string> = {
  [PqrsStatus.PENDIENTE_ASIGNACION]: "bg-amber-500",
  [PqrsStatus.RECIBIDA]: "bg-admin-midnight",
  [PqrsStatus.EN_REVISION]: "bg-admin-blue",
  [PqrsStatus.PENDIENTE_PAGO_REEMBOLSO]: "bg-teal-500",
  [PqrsStatus.RESUELTA]: "bg-green-500",
  [PqrsStatus.CERRADA]: "bg-gray-400",
};

/**
 * Estados en los que el PQRS todavía se considera "en proceso" desde la
 * perspectiva del comprador: ya fue atendido pero no está cerrado del todo
 * (falta que se pague el reembolso aprobado).
 */
export const pqrsInProgressStatuses: PqrsStatus[] = [
  PqrsStatus.PENDIENTE_ASIGNACION,
  PqrsStatus.RECIBIDA,
  PqrsStatus.EN_REVISION,
  PqrsStatus.PENDIENTE_PAGO_REEMBOLSO,
];

export const marketPlaceIssueReasonLabel: Record<MarketPlaceIssueReason, string> = {
  [MarketPlaceIssueReason.CODE_INVALID]: "El código no funciona",
  [MarketPlaceIssueReason.NOT_DELIVERED]: "No ha recibido el producto",
  [MarketPlaceIssueReason.NOT_AS_DESCRIBED]: "No es como se describe",
  [MarketPlaceIssueReason.OTHER]: "Otro motivo",
};

export const pqrsResolutionActionLabel: Record<PqrsResolutionAction, string> = {
  [PqrsResolutionAction.DISMISS]: "Rechazar reclamo",
  [PqrsResolutionAction.REFUND]: "Aprobar reembolso",
};

export const formatPqrsDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
