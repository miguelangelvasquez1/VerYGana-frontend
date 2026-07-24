import { PqrsStatus, PqrsType } from "@/types/Pqrs.types";

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
  [PqrsStatus.RESUELTA]: "Resuelta",
  [PqrsStatus.CERRADA]: "Cerrada",
};

export const pqrsStatusColor: Record<PqrsStatus, string> = {
  [PqrsStatus.PENDIENTE_ASIGNACION]: "text-amber-600 bg-amber-50",
  [PqrsStatus.RECIBIDA]: "text-[#03548C] bg-[#03548C]/10",
  [PqrsStatus.EN_REVISION]: "text-blue-600 bg-blue-50",
  [PqrsStatus.RESUELTA]: "text-green-600 bg-green-50",
  [PqrsStatus.CERRADA]: "text-gray-600 bg-gray-100",
};

export const pqrsStatusDot: Record<PqrsStatus, string> = {
  [PqrsStatus.PENDIENTE_ASIGNACION]: "bg-amber-500",
  [PqrsStatus.RECIBIDA]: "bg-[#03548C]",
  [PqrsStatus.EN_REVISION]: "bg-blue-500",
  [PqrsStatus.RESUELTA]: "bg-green-500",
  [PqrsStatus.CERRADA]: "bg-gray-400",
};

export const formatPqrsDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
