"use client";

import React, { useState } from "react";
import { CreateTicketEarningRuleRequestDTO } from "@/types/raffles/ticketEarningRule.types";

interface Props {
  onSubmit: (data: CreateTicketEarningRuleRequestDTO) => void;
}

interface FormErrors {
  ruleName?: string;
  description?: string;
  ruleType?: string;
  priority?: string;
  minPurchaseAmount?: string;
  minAdsWatched?: string;
  achievementType?: string;
  referralAddedQuantity?: string;
  ticketsToAward?: string;
}

export default function CreateTicketEarningRuleForm({ onSubmit }: Props) {
  const [formData, setFormData] =
    useState<CreateTicketEarningRuleRequestDTO>({
      ruleName: "",
      description: "",
      ruleType: "PURCHASE",
      priority: 1,
      ticketsToAward: 1,
      minPurchaseAmount: undefined,
      minAdsWatched: undefined,
      achievementType: "",
      referralAddedQuantity: undefined,
    });

  const [errors, setErrors] = useState<FormErrors>({});

  /* ================= VALIDACIÓN ================= */

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // ruleName
    if (!formData.ruleName.trim()) {
      newErrors.ruleName = "El nombre de la regla es obligatorio";
    } else if (formData.ruleName.length > 100) {
      newErrors.ruleName = "El nombre de la regla no puede exceder 100 caracteres";
    }

    // description
    if (formData.description && formData.description.length > 255) {
      newErrors.description = "La descripción no puede exceder 255 caracteres";
    }

    // ruleType
    if (!formData.ruleType) {
      newErrors.ruleType = "El tipo de regla es obligatorio";
    }

    // priority
    if (formData.priority == null) {
      newErrors.priority = "La prioridad es obligatoria";
    } else if (formData.priority < 1) {
      newErrors.priority = "La prioridad debe ser al menos 1";
    } else if (formData.priority > 5) {
      newErrors.priority = "La prioridad no puede exceder 5";
    }

    // minPurchaseAmount
    if (
      formData.minPurchaseAmount == null ||
      formData.minPurchaseAmount < 0
    ) {
      newErrors.minPurchaseAmount =
        "El monto mínimo de compra debe ser positivo";
    }

    // minAdsWatched
    if (formData.minAdsWatched != null && formData.minAdsWatched < 0) {
      newErrors.minAdsWatched =
        "El mínimo de anuncios vistos debe ser positivo";
    }

    // achievementType
    if (
      formData.achievementType &&
      formData.achievementType.length > 100
    ) {
      newErrors.achievementType =
        "El tipo de logro no puede exceder 100 caracteres";
    }

    // referralAddedQuantity
    if (
      formData.referralAddedQuantity != null &&
      formData.referralAddedQuantity <= 0
    ) {
      newErrors.referralAddedQuantity =
        "La cantidad de referidos añadidos debe ser positiva";
    }

    // ticketsToAward
    if (formData.ticketsToAward == null) {
      newErrors.ticketsToAward =
        "Cantidad de tickets a otorgar es obligatoria";
    } else if (formData.ticketsToAward < 1) {
      newErrors.ticketsToAward =
        "Cantidad de tickets a otorgar debe ser al menos 1";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        e.target.type === "number"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));

    // limpiar error del campo al escribir
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(formData);
  };

  /* ================= UI ================= */

  const inputStyle = (field?: string) =>
    `w-full border rounded-lg px-3 py-2 mt-1 ${
      field && errors[field as keyof FormErrors]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-md space-y-6"
    >
      <h2 className="text-xl font-bold text-gray-900">
        Crear Regla de Tickets
      </h2>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          name="ruleName"
          value={formData.ruleName}
          onChange={handleChange}
          className={inputStyle("ruleName")}
        />
        {errors.ruleName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.ruleName}
          </p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={inputStyle("description")}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description}
          </p>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium">
          Tipo de Regla
        </label>
        <select
          name="ruleType"
          value={formData.ruleType}
          onChange={handleChange}
          className={inputStyle("ruleType")}
        >
          <option value="PURCHASE">Compra</option>
          <option value="ADS_WATCHED">Anuncios vistos</option>
          <option value="GAME_ACHIEVEMENT">Logro en juego</option>
          <option value="REFERRAL">Referido</option>
        </select>
      </div>

      {/* Condicionales */}
      {formData.ruleType === "PURCHASE" && (
        <div>
          <label className="block text-sm font-medium">
            Monto mínimo de compra
          </label>
          <input
            type="number"
            name="minPurchaseAmount"
            value={formData.minPurchaseAmount ?? ""}
            onChange={handleChange}
            className={inputStyle("minPurchaseAmount")}
          />
          {errors.minPurchaseAmount && (
            <p className="text-red-500 text-sm mt-1">
              {errors.minPurchaseAmount}
            </p>
          )}
        </div>
      )}

      {formData.ruleType === "ADS_WATCHED" && (
        <div>
          <label className="block text-sm font-medium">
            Mínimo anuncios vistos
          </label>
          <input
            type="number"
            name="minAdsWatched"
            value={formData.minAdsWatched ?? ""}
            onChange={handleChange}
            className={inputStyle("minAdsWatched")}
          />
          {errors.minAdsWatched && (
            <p className="text-red-500 text-sm mt-1">
              {errors.minAdsWatched}
            </p>
          )}
        </div>
      )}

      {formData.ruleType === "GAME_ACHIEVEMENT" && (
        <div>
          <label className="block text-sm font-medium">
            Tipo de logro
          </label>
          <input
            name="achievementType"
            value={formData.achievementType ?? ""}
            onChange={handleChange}
            className={inputStyle("achievementType")}
          />
          {errors.achievementType && (
            <p className="text-red-500 text-sm mt-1">
              {errors.achievementType}
            </p>
          )}
        </div>
      )}

      {formData.ruleType === "REFERRAL" && (
        <div>
          <label className="block text-sm font-medium">
            Cantidad de referidos requeridos
          </label>
          <input
            type="number"
            name="referralAddedQuantity"
            value={formData.referralAddedQuantity ?? ""}
            onChange={handleChange}
            className={inputStyle("referralAddedQuantity")}
          />
          {errors.referralAddedQuantity && (
            <p className="text-red-500 text-sm mt-1">
              {errors.referralAddedQuantity}
            </p>
          )}
        </div>
      )}

      {/* Prioridad */}
      <div>
        <label className="block text-sm font-medium">
          Prioridad
        </label>
        <input
          type="number"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className={inputStyle("priority")}
        />
        {errors.priority && (
          <p className="text-red-500 text-sm mt-1">
            {errors.priority}
          </p>
        )}
      </div>

      {/* Tickets */}
      <div>
        <label className="block text-sm font-medium">
          Tickets a otorgar
        </label>
        <input
          type="number"
          name="ticketsToAward"
          value={formData.ticketsToAward}
          onChange={handleChange}
          className={inputStyle("ticketsToAward")}
        />
        {errors.ticketsToAward && (
          <p className="text-red-500 text-sm mt-1">
            {errors.ticketsToAward}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
      >
        Crear Regla
      </button>
    </form>
  );
}
