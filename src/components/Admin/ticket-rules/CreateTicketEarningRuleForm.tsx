"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  CreateTicketEarningRuleRequestDTO,
  TicketEarningRuleType,
} from "@/types/raffles/ticketEarningRule.types";

interface Props {
  onSubmit: (data: CreateTicketEarningRuleRequestDTO) => void;
  onCancel?: () => void;
}

interface FormErrors {
  ruleName?: string;
  description?: string;
  ruleType?: string;
  priority?: string;
  minPurchaseAmount?: string;
  referralAddedQuantity?: string;
  ticketsToAward?: string;
}

const RULE_TYPE_META: Record<
    TicketEarningRuleType,
    { label: string; icon: React.ReactNode; hint: string; color: string; bg: string }
> = {
  [TicketEarningRuleType.PURCHASE]: {
    label: "Compra",
    icon: <ShoppingCart size={16} />,
    hint: "Otorga tickets al realizar una compra que supere el monto mínimo",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  [TicketEarningRuleType.DAILY_LOGIN]: {
    label: "Login Diario",
    icon: <Calendar size={16} />,
    hint: "Otorga tickets por cada día que el usuario inicie sesión",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  [TicketEarningRuleType.REFERRAL]: {
    label: "Referidos",
    icon: <Users size={16} />,
    hint: "Otorga tickets al referir la cantidad indicada de nuevos usuarios",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  [TicketEarningRuleType.ADS_WATCHED]: {
    label: "Anuncios Vistos",
    icon: <Trophy size={16} />,
    hint: "Otorga tickets al visualizar la cantidad indicada de anuncios",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
  },
  [TicketEarningRuleType.GAME_ACHIEVEMENT]: {
    label: "Logro del Juego",
    icon: <Trophy size={16} />,
    hint: "Otorga tickets al completar logros específicos del juego",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200",
  },
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function CreateTicketEarningRuleForm({
                                                      onSubmit,
                                                      onCancel,
                                                    }: Props) {
  const [formData, setFormData] = useState<CreateTicketEarningRuleRequestDTO>({
    ruleName: "",
    description: "",
    ruleType: TicketEarningRuleType.PURCHASE,
    priority: 1,
    ticketsToAward: 1,
    minPurchaseAmount: undefined,
    dailyLogin: undefined,
    referralAddedQuantity: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ============================================================
     VALIDACIÓN
     ============================================================ */

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!formData.ruleName.trim()) {
      e.ruleName = "El nombre de la regla es obligatorio";
    } else if (formData.ruleName.length > 100) {
      e.ruleName = "No puede exceder 100 caracteres";
    }

    if (formData.description && formData.description.length > 255) {
      e.description = "No puede exceder 255 caracteres";
    }

    if (!formData.ruleType) {
      e.ruleType = "El tipo de regla es obligatorio";
    }

    if (formData.priority == null) {
      e.priority = "La prioridad es obligatoria";
    } else if (formData.priority < 1 || formData.priority > 5) {
      e.priority = "Debe estar entre 1 y 5";
    }

    if (formData.ruleType === TicketEarningRuleType.PURCHASE) {
      if (formData.minPurchaseAmount == null || formData.minPurchaseAmount < 0) {
        e.minPurchaseAmount = "El monto mínimo debe ser mayor o igual a 0";
      }
    }

    if (formData.ruleType === TicketEarningRuleType.REFERRAL) {
      if (
          formData.referralAddedQuantity == null ||
          formData.referralAddedQuantity < 1
      ) {
        e.referralAddedQuantity = "La cantidad de referidos debe ser al menos 1";
      }
    }

    if (formData.ticketsToAward == null) {
      e.ticketsToAward = "La cantidad de tickets es obligatoria";
    } else if (formData.ticketsToAward < 1) {
      e.ticketsToAward = "Debe ser al menos 1 ticket";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ============================================================
     HANDLE CHANGE
     ============================================================ */

  const handleChange = (
      e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
  ) => {
    const { name, value, type } = e.target;

    let parsed: string | number | undefined;
    if (type === "number") {
      parsed = value === "" ? undefined : Number(value);
    } else {
      parsed = value;
    }

    if (name === "ruleType") {
      setFormData((prev) => ({
        ...prev,
        ruleType: value as TicketEarningRuleType,
        minPurchaseAmount: undefined,
        dailyLogin:
            value === TicketEarningRuleType.DAILY_LOGIN ? true : undefined,
        referralAddedQuantity: undefined,
      }));
      setErrors({});
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: parsed }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     HELPERS
     ============================================================ */

  const inputClass = (field: keyof FormErrors) =>
      `w-full border-2 rounded-xl px-4 py-2.5 mt-1 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
          errors[field]
              ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500"
              : "border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-400"
      }`;

  const meta = RULE_TYPE_META[formData.ruleType];

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ==================================================
          HEADER
      ================================================== */}

        <div className="border-b-2 border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Nueva Regla de Tickets
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configura cómo los usuarios ganan tickets en las rifas
          </p>
        </div>

        {/* ==================================================
          SCROLLABLE CONTENT
      ================================================== */}

        <div className="max-h-[calc(80vh-200px)] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Nombre de la regla <span className="text-rose-500">*</span>
            </label>
            <input
                name="ruleName"
                value={formData.ruleName}
                onChange={handleChange}
                placeholder="Ej: Compra mínima $50.000"
                maxLength={100}
                className={inputClass("ruleName")}
            />
            <div className="flex justify-between mt-1.5">
              {errors.ruleName ? (
                  <p className="text-rose-500 text-xs flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.ruleName}
                  </p>
              ) : (
                  <span />
              )}
              <span className="text-xs text-slate-400">
              {formData.ruleName.length}/100
            </span>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Descripción
            </label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe brevemente cómo funciona esta regla..."
                rows={3}
                maxLength={255}
                className={inputClass("description")}
            />
            <div className="flex justify-between mt-1.5">
              {errors.description ? (
                  <p className="text-rose-500 text-xs flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description}
                  </p>
              ) : (
                  <span />
              )}
              <span className="text-xs text-slate-400">
              {(formData.description ?? "").length}/255
            </span>
            </div>
          </div>

          {/* TIPO DE REGLA */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Tipo de Regla <span className="text-rose-500">*</span>
            </label>
            <select
                name="ruleType"
                value={formData.ruleType}
                onChange={handleChange}
                className={inputClass("ruleType")}
            >
              <option value={TicketEarningRuleType.PURCHASE}>Compra</option>
              <option value={TicketEarningRuleType.DAILY_LOGIN}>
                Iniciar sesión diariamente
              </option>
              <option value={TicketEarningRuleType.REFERRAL}>Referidos</option>
              <option value={TicketEarningRuleType.ADS_WATCHED}>
                Anuncios visualizados
              </option>
              <option value={TicketEarningRuleType.GAME_ACHIEVEMENT}>
                Logros del juego
              </option>
            </select>

            <div className={`
            mt-2
            flex
            items-start
            gap-2.5
            p-3
            rounded-xl
            border-2
            ${meta.bg}
          `}>
              <span className={`shrink-0 mt-0.5 ${meta.color}`}>{meta.icon}</span>
              <p className={`text-sm ${meta.color}`}>{meta.hint}</p>
            </div>
          </div>

          {/* CONDICIONAL: PURCHASE */}
          {formData.ruleType === TicketEarningRuleType.PURCHASE && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Monto mínimo de compra <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                $
              </span>
                  <input
                      type="number"
                      name="minPurchaseAmount"
                      value={formData.minPurchaseAmount ?? ""}
                      onChange={handleChange}
                      min={0}
                      placeholder="0"
                      className={`${inputClass("minPurchaseAmount")} pl-8`}
                  />
                </div>
                {errors.minPurchaseAmount && (
                    <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.minPurchaseAmount}
                    </p>
                )}
              </div>
          )}

          {/* CONDICIONAL: DAILY_LOGIN */}
          {formData.ruleType === TicketEarningRuleType.DAILY_LOGIN && (
              <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Login Diario Activado
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Se otorgarán <strong>{formData.ticketsToAward || 1}</strong> ticket
                    {formData.ticketsToAward !== 1 ? "s" : ""} por cada día que el
                    usuario inicie sesión.
                  </p>
                </div>
              </div>
          )}

          {/* CONDICIONAL: REFERRAL */}
          {formData.ruleType === TicketEarningRuleType.REFERRAL && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Cantidad de referidos requeridos{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                    type="number"
                    name="referralAddedQuantity"
                    value={formData.referralAddedQuantity ?? ""}
                    onChange={handleChange}
                    min={1}
                    placeholder="1"
                    className={inputClass("referralAddedQuantity")}
                />
                {errors.referralAddedQuantity && (
                    <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.referralAddedQuantity}
                    </p>
                )}
              </div>
          )}

          {/* CONDICIONAL: ADS_WATCHED */}
          {formData.ruleType === TicketEarningRuleType.ADS_WATCHED && (
              <div className="bg-cyan-50/80 border-2 border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-cyan-900">
                    Anuncios Visualizados
                  </p>
                  <p className="text-sm text-cyan-700 mt-0.5">
                    Se otorgarán <strong>{formData.ticketsToAward || 1}</strong> ticket
                    {formData.ticketsToAward !== 1 ? "s" : ""} por cada{" "}
                    <strong>5 anuncios</strong> visualizados.
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">
                    💡 Puedes configurar la cantidad de anuncios en la edición de la regla.
                  </p>
                </div>
              </div>
          )}

          {/* CONDICIONAL: GAME_ACHIEVEMENT */}
          {formData.ruleType === TicketEarningRuleType.GAME_ACHIEVEMENT && (
              <div className="bg-rose-50/80 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-900">
                    Logros del Juego
                  </p>
                  <p className="text-sm text-rose-700 mt-0.5">
                    Se otorgarán <strong>{formData.ticketsToAward || 1}</strong> ticket
                    {formData.ticketsToAward !== 1 ? "s" : ""} al completar logros
                    específicos.
                  </p>
                  <p className="text-xs text-rose-600 mt-1">
                    💡 Puedes configurar los logros específicos en la edición de la regla.
                  </p>
                </div>
              </div>
          )}

          {/* PRIORIDAD + TICKETS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Prioridad <span className="text-rose-500">*</span>
              </label>
              <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  min={1}
                  max={5}
                  className={inputClass("priority")}
              />
              {errors.priority ? (
                  <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.priority}
                  </p>
              ) : (
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Nivel de prioridad (1 = más alta, 5 = más baja)
                  </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Tickets a otorgar <span className="text-rose-500">*</span>
              </label>
              <input
                  type="number"
                  name="ticketsToAward"
                  value={formData.ticketsToAward}
                  onChange={handleChange}
                  min={1}
                  className={inputClass("ticketsToAward")}
              />
              {errors.ticketsToAward && (
                  <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.ticketsToAward}
                  </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
          BOTONES - Fijos en la parte inferior
      ================================================== */}

        <div className="flex gap-3 pt-4 border-t-2 border-slate-200 mt-4">
          {onCancel && (
              <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1 cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all border-2 border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
          )}

          <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 cursor-pointer px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
            ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Crear Regla
                </>
            )}
          </button>
        </div>

        {/* ==================================================
          SCROLLBAR STYLES
      ================================================== */}

        <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
      </form>
  );
}