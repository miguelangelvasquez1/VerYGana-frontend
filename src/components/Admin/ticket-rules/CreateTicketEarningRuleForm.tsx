"use client";

import React, { useState } from "react";
import { ShoppingCart, Calendar, Users } from "lucide-react";
import {
  CreateTicketEarningRuleRequestDTO,
  TicketEarningRuleType,
} from "@/types/raffles/ticketEarningRule.types";

interface Props {
  onSubmit: (data: CreateTicketEarningRuleRequestDTO) => void;
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

const RULE_TYPE_META = {
  [TicketEarningRuleType.PURCHASE]: {
    label: "Compra",
    icon: <ShoppingCart size={14} />,
    hint: "Se otorgan tickets al realizar una compra que supere el monto mínimo.",
  },
  [TicketEarningRuleType.DAILY_LOGIN]: {
    label: "Login Diario",
    icon: <Calendar size={14} />,
    hint: "Se otorgan tickets por cada día que el usuario inicie sesión.",
  },
  [TicketEarningRuleType.REFERRAL]: {
    label: "Referidos",
    icon: <Users size={14} />,
    hint: "Se otorgan tickets al referir la cantidad indicada de nuevos usuarios.",
  },
};

const base =
  "w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";

export default function CreateTicketEarningRuleForm({ onSubmit }: Props) {
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

  /* ================= VALIDACIÓN ================= */

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

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let parsed: string | number | boolean | undefined;
    if (type === "checkbox") {
      parsed = checked;
    } else if (type === "number") {
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

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  /* ================= HELPERS ================= */

  const inputClass = (field: keyof FormErrors) =>
    `${base} ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

  const meta = RULE_TYPE_META[formData.ruleType];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Crear Regla de Tickets</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configura cómo los usuarios ganan tickets
        </p>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          name="ruleName"
          value={formData.ruleName}
          onChange={handleChange}
          placeholder="Ej: Compra mínima $50.000"
          maxLength={100}
          className={inputClass("ruleName")}
        />
        <div className="flex justify-between mt-1">
          {errors.ruleName ? (
            <p className="text-red-500 text-xs">{errors.ruleName}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            {formData.ruleName.length}/100
          </span>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe brevemente la regla..."
          rows={3}
          maxLength={255}
          className={inputClass("description")}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-red-500 text-xs">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            {(formData.description ?? "").length}/255
          </span>
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Regla <span className="text-red-500">*</span>
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
        </select>
        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
          {meta.icon}
          {meta.hint}
        </p>
      </div>

      {/* Condicional: PURCHASE */}
      {formData.ruleType === TicketEarningRuleType.PURCHASE && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Monto mínimo de compra <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none mt-0.5">
              $
            </span>
            <input
              type="number"
              name="minPurchaseAmount"
              value={formData.minPurchaseAmount ?? ""}
              onChange={handleChange}
              min={0}
              placeholder="0"
              className={`${inputClass("minPurchaseAmount")} pl-7`}
            />
          </div>
          {errors.minPurchaseAmount && (
            <p className="text-red-500 text-xs mt-1">
              {errors.minPurchaseAmount}
            </p>
          )}
        </div>
      )}

      {/* Condicional: DAILY_LOGIN */}
      {formData.ruleType === TicketEarningRuleType.DAILY_LOGIN && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
          <Calendar size={20} className="text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-800">
              Login Diario Activado
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Se otorgarán {formData.ticketsToAward} ticket(s) por cada día que
              el usuario inicie sesión.
            </p>
          </div>
        </div>
      )}

      {/* Condicional: REFERRAL */}
      {formData.ruleType === TicketEarningRuleType.REFERRAL && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cantidad de referidos requeridos <span className="text-red-500">*</span>
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
            <p className="text-red-500 text-xs mt-1">
              {errors.referralAddedQuantity}
            </p>
          )}
        </div>
      )}

      {/* Prioridad + Tickets en fila */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prioridad <span className="text-red-500">*</span>
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
            <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Entre 1 y 5</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tickets a otorgar <span className="text-red-500">*</span>
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
            <p className="text-red-500 text-xs mt-1">{errors.ticketsToAward}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
      >
        Crear Regla
      </button>
    </form>
  );
}
