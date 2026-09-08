import { BankAccountType, DocType, PayoutMethodType, VerificationStatus } from "@/types/PayoutMethod.types";
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

export const payoutMethodTypeLabel: Record<PayoutMethodType, string> = {
  [PayoutMethodType.BANK_ACCOUNT]: "Cuenta bancaria",
  [PayoutMethodType.NEQUI]: "Nequi",
  [PayoutMethodType.DAVIPLATA]: "Daviplata",
};

export const verificationStatusLabel: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING_VERIFICATION]: "Pendiente de verificación",
  [VerificationStatus.AWAITING_OTP]: "Esperando código OTP",
  [VerificationStatus.UNDER_REVIEW]: "En revisión",
  [VerificationStatus.VERIFIED]: "Verificado",
  [VerificationStatus.REJECTED]: "Rechazado",
  [VerificationStatus.SUSPENDED]: "Suspendido",
};

export const verificationStatusColor: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING_VERIFICATION]: "text-gray-700 bg-gray-100",
  [VerificationStatus.AWAITING_OTP]: "text-amber-700 bg-amber-100",
  [VerificationStatus.UNDER_REVIEW]: "text-[#03548C] bg-[#03548C]/10",
  [VerificationStatus.VERIFIED]: "text-green-700 bg-green-100",
  [VerificationStatus.REJECTED]: "text-red-700 bg-red-100",
  [VerificationStatus.SUSPENDED]: "text-red-700 bg-red-100",
};

export const cashRefundStatusLabel: Record<CashRefundStatus, string> = {
  [CashRefundStatus.PENDING_PAYMENT]: "Pendiente de pago",
  [CashRefundStatus.PAID]: "Pagado",
};

export const cashRefundStatusColor: Record<CashRefundStatus, string> = {
  [CashRefundStatus.PENDING_PAYMENT]: "text-amber-700 bg-amber-100",
  [CashRefundStatus.PAID]: "text-green-700 bg-green-100",
};
