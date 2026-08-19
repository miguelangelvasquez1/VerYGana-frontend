import { BankAccountType, DocType } from "@/types/PayoutMethod.types";
import { CashRefundStatus } from "@/types/finance/Treasury.types";

export const docTypeLabel: Record<DocType, string> = {
  [DocType.CC]: "Cédula de ciudadanía",
  [DocType.CE]: "Cédula de extranjería",
  [DocType.NIT]: "NIT",
  [DocType.PP]: "Pasaporte",
  [DocType.TI]: "Tarjeta de identidad",
};

export const bankAccountTypeLabel: Record<BankAccountType, string> = {
  [BankAccountType.SAVINGS]: "Ahorros",
  [BankAccountType.CHECKING]: "Corriente",
};

export const cashRefundStatusLabel: Record<CashRefundStatus, string> = {
  [CashRefundStatus.PENDING_PAYMENT]: "Pendiente de pago",
  [CashRefundStatus.PAID]: "Pagado",
};

export const cashRefundStatusColor: Record<CashRefundStatus, string> = {
  [CashRefundStatus.PENDING_PAYMENT]: "text-amber-700 bg-amber-100",
  [CashRefundStatus.PAID]: "text-green-700 bg-green-100",
};
