"use client";

import { useState } from "react";
import { Landmark, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { submitCashRefundBankDetails } from "@/services/PurchaseItemService";
import { SubmitCashRefundBankDetailsRequestDTO } from "@/types/finance/Treasury.types";
import { BankAccountType, DocType } from "@/types/PayoutMethod.types";

interface Props {
  purchaseItemId: number;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  [DocType.CC]: "Cédula de ciudadanía",
  [DocType.CE]: "Cédula de extranjería",
  [DocType.NIT]: "NIT",
  [DocType.PP]: "Pasaporte",
  [DocType.TI]: "Tarjeta de identidad",
};

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  [BankAccountType.SAVINGS]: "Ahorros",
  [BankAccountType.CHECKING]: "Corriente",
};

const initialForm: SubmitCashRefundBankDetailsRequestDTO = {
  accountHolderName: "",
  accountHolderDoc: "",
  accountHolderDocType: DocType.CC,
  bankName: "",
  accountNumber: "",
  accountType: BankAccountType.SAVINGS,
};

const RefundBankDetailsForm = ({ purchaseItemId }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    form.accountHolderName.trim() &&
    form.accountHolderDoc.trim() &&
    form.bankName.trim() &&
    form.accountNumber.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      await submitCashRefundBankDetails(purchaseItemId, form);
      toast.success("Datos bancarios enviados. Procesaremos tu reembolso pronto.");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al enviar los datos bancarios");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          Enviamos tus datos bancarios. Te notificaremos cuando el reembolso sea procesado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-3">
      <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        <Landmark className="w-3.5 h-3.5 text-[#03548C]" />
        Datos bancarios para tu reembolso
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del titular *</label>
          <input
            name="accountHolderName"
            value={form.accountHolderName}
            onChange={handleChange}
            required
            disabled={submitting}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo doc. *</label>
            <select
              name="accountHolderDocType"
              value={form.accountHolderDocType}
              onChange={handleChange}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            >
              {Object.values(DocType).map((t) => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Documento *</label>
            <input
              name="accountHolderDoc"
              value={form.accountHolderDoc}
              onChange={handleChange}
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Banco *</label>
          <input
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            required
            disabled={submitting}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo cuenta *</label>
            <select
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            >
              {Object.values(BankAccountType).map((t) => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">N.º de cuenta *</label>
            <input
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full bg-[#03548C] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#024270] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Enviando..." : "Enviar datos bancarios"}
      </button>
    </form>
  );
};

export default RefundBankDetailsForm;
