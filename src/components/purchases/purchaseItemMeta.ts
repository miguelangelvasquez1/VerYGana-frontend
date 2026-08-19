import { PurchaseItemStatus } from "@/types/purchases/purchaseItem.types";

export const purchaseItemStatusLabel: Record<PurchaseItemStatus, string> = {
  [PurchaseItemStatus.PENDING]: "Pendiente",
  [PurchaseItemStatus.CLAIMED]: "Entregado",
  [PurchaseItemStatus.IN_REVIEW]: "En revisión",
  [PurchaseItemStatus.EXPIRED_UNCLAIMED]: "Expiró sin reclamar",
  [PurchaseItemStatus.REFUNDED]: "Reembolsado",
  [PurchaseItemStatus.CANCELLED]: "Cancelado",
};

export const purchaseItemStatusColor: Record<PurchaseItemStatus, string> = {
  [PurchaseItemStatus.PENDING]: "text-amber-700 bg-amber-100",
  [PurchaseItemStatus.CLAIMED]: "text-green-700 bg-green-100",
  [PurchaseItemStatus.IN_REVIEW]: "text-purple-700 bg-purple-100",
  [PurchaseItemStatus.EXPIRED_UNCLAIMED]: "text-orange-700 bg-orange-100",
  [PurchaseItemStatus.REFUNDED]: "text-blue-700 bg-blue-100",
  [PurchaseItemStatus.CANCELLED]: "text-gray-600 bg-gray-200",
};

export const purchaseItemStatusDot: Record<PurchaseItemStatus, string> = {
  [PurchaseItemStatus.PENDING]: "bg-amber-500",
  [PurchaseItemStatus.CLAIMED]: "bg-green-500",
  [PurchaseItemStatus.IN_REVIEW]: "bg-purple-500",
  [PurchaseItemStatus.EXPIRED_UNCLAIMED]: "bg-orange-500",
  [PurchaseItemStatus.REFUNDED]: "bg-blue-500",
  [PurchaseItemStatus.CANCELLED]: "bg-gray-400",
};
