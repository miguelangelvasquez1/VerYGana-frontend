"use client";

import { ArrowLeft, CalendarDays } from "lucide-react";
import React, { useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  RaffleResponseDTO,
  RaffleType,
  UpdateRaffleRequestDTO,
} from "@/types/raffles/raffle.types";
import TargetAudienceFields, {
  isTargetAudienceValid,
} from "@/components/shared/targeting/TargetAudienceFields";

interface Props {
  raffle: RaffleResponseDTO;
  onSubmit: (data: UpdateRaffleRequestDTO) => Promise<unknown>;
  onCancel: () => void;
  onBack?: () => void;
}

const inputCls = (error?: string | boolean) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors ${
        error ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function EditRaffleForm({ raffle, onSubmit, onCancel, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const originalStartDate = useMemo(
      () => (raffle.startDate ? new Date(raffle.startDate) : new Date()),
      [raffle.startDate]
  );

  // Inicialización con 18 años por defecto si minAge no está definido
  const [formData, setFormData] = useState<UpdateRaffleRequestDTO>({
    title: raffle.title,
    description: raffle.description,
    raffleType: raffle.raffleType,
    requiresPet: raffle.requiresPet,
    startDate: raffle.startDate,
    endDate: raffle.endDate,
    drawDate: raffle.drawDate,
    targeting: {
      minAge: 18,
      ...raffle.targeting,
    },
  });

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /* ================== SANITIZADOR DE EDADES ================== */
  const handleTargetingChange = (newTargeting: Record<string, unknown>) => {
    const sanitizeAge = (val: unknown, fallback?: number) => {
      if (val === "" || val === undefined || val === null) {
        return fallback !== undefined ? fallback : "";
      }
      const num = parseInt(String(val), 10);
      if (isNaN(num)) return fallback !== undefined ? fallback : "";
      if (num > 100) return 100;
      if (num < 0) return 0;
      return num;
    };

    const cleanedTargeting = {
      ...newTargeting,
      minAge: sanitizeAge(newTargeting?.minAge, 18),
      maxAge: sanitizeAge(newTargeting?.maxAge),
    };

    setFormData((prev) => ({ ...prev, targeting: cleanedTargeting }));
  };

  /* ================== REGLAS DE VALIDACIÓN EN TIEMPO REAL ================== */
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const now = new Date();

    // 1. Título y Descripción
    const cleanTitle = (formData.title || "").trim();
    const cleanDesc = (formData.description || "").trim();

    if (!cleanTitle) {
      errs.title = "El título es obligatorio.";
    } else if (cleanTitle.length < 5) {
      errs.title = "El título debe tener al menos 5 caracteres.";
    }

    if (!cleanDesc) {
      errs.description = "La descripción es obligatoria.";
    } else if (cleanDesc.length < 10) {
      errs.description = "La descripción debe tener al menos 10 caracteres.";
    }

    // 2. Fechas
    if (!formData.startDate) errs.startDate = "Selecciona fecha de inicio";
    if (!formData.endDate) errs.endDate = "Selecciona fecha de fin";
    if (!formData.drawDate) errs.drawDate = "Selecciona fecha de sorteo";

    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;
    const draw = formData.drawDate ? new Date(formData.drawDate) : null;

    if (start && start < now && start.getTime() !== originalStartDate.getTime()) {
      errs.startDate = "La fecha de inicio no puede ser en el pasado.";
    }

    if (start && end) {
      const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (start >= end) {
        errs.startDate = "La fecha de inicio debe ser anterior a la de fin.";
        errs.endDate = "La fecha de fin debe ser posterior a la de inicio.";
      } else if (diffMinutes < 15) {
        errs.endDate = "Las inscripciones deben durar al menos 15 minutos.";
      }
    }

    if (end && draw && draw < end) {
      errs.drawDate = "El sorteo debe realizarse en o después del fin de inscripciones.";
    }

    // 3. Edades (Validación Estricta >= 18 y Lógica Racional)
    const minAgeRaw = formData.targeting?.minAge;
    const maxAgeRaw = formData.targeting?.maxAge;

    const hasMinAge = minAgeRaw !== undefined && minAgeRaw !== null && minAgeRaw !== "";
    const hasMaxAge = maxAgeRaw !== undefined && maxAgeRaw !== null && maxAgeRaw !== "";

    const numMin = hasMinAge ? Number(minAgeRaw) : NaN;
    const numMax = hasMaxAge ? Number(maxAgeRaw) : NaN;

    // Validar límite inferior individual para Edad Mínima
    if (hasMinAge && (isNaN(numMin) || numMin < 18)) {
      errs.minAge = "La edad mínima debe ser de al menos 18 años.";
    }

    // Validar límite inferior individual para Edad Máxima
    if (hasMaxAge && (isNaN(numMax) || numMax < 18)) {
      errs.maxAge = "La edad máxima debe ser de al menos 18 años.";
    }

    // Validar relación lógica entre ambas
    if (hasMinAge && hasMaxAge && !isNaN(numMin) && !isNaN(numMax)) {
      if (numMax < numMin) {
        errs.maxAge = "La edad máxima no puede ser menor a la edad mínima.";
      }
    }

    if (!isTargetAudienceValid(formData.targeting)) {
      errs.targeting = "Configuración de audiencias no válida.";
    }

    return errs;
  }, [formData, originalStartDate]);

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name } = target;

    let parsedValue: unknown = target.value;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      parsedValue = target.checked;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const datePickerProps = {
    showTimeInput: true,
    timeInputLabel: "Hora:",
    dateFormat: "dd/MM/yyyy HH:mm",
    wrapperClassName: "w-full",
    popperPlacement: "bottom-start" as const,
    popperClassName: "z-[9999]",
    calendarClassName: "shadow-2xl border-0 rounded-2xl",
    placeholderText: "dd/mm/aaaa hh:mm",
    showPopperArrow: false,
    autoComplete: "off",
  };

  // Determina si se debe mostrar el error basado en HCI (solo tras Blur o Submit)
  const showError = (field: string) => (submitted || touched[field]) && errors[field];

  return (
      <div className="flex flex-col max-h-[80vh] w-full bg-white rounded-2xl overflow-hidden">
        {/* ===== CABECERA FIJA ===== */}
        <div className="px-6 pr-12 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="inline-flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a las rifas
            </button>
          )}
          <h2 className="text-lg font-bold text-admin-navy">Editar Rifa</h2>
          <p className="text-xs text-gray-500">
            Ajusta la información, fechas y restricciones
          </p>
        </div>

        {/* ===== CUERPO DEL FORMULARIO CON SCROLL ===== */}
        <form
            id="edit-raffle-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div>
            <label className={labelCls}>Título</label>
            <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={() => markTouched("title")}
                className={inputCls(showError("title"))}
                required
            />
            {showError("title") && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={() => markTouched("description")}
                rows={3}
                className={`${inputCls(showError("description"))} resize-none`}
                required
            />
            {showError("description") && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Tipo de Rifa</label>
            <select
                name="raffleType"
                value={formData.raffleType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors bg-white cursor-pointer"
            >
              <option value={RaffleType.STANDARD}>Estándar</option>
              <option value={RaffleType.PREMIUM}>Premium</option>
            </select>
          </div>

          {/* ===== SECCIÓN DE FECHAS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Inicio de inscripciones
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                <DatePicker
                    {...datePickerProps}
                    minDate={new Date()}
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date: Date | null) => {
                      setFormData((prev) => ({
                        ...prev,
                        startDate: date ? date.toISOString() : "",
                      }));
                    }}
                    onCalendarClose={() => {
                      markTouched("startDate");
                      markTouched("endDate");
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors ${
                        showError("startDate") ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                />
              </div>
              {showError("startDate") && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Fin de inscripciones
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                <DatePicker
                    {...datePickerProps}
                    selected={formData.endDate ? new Date(formData.endDate) : null}
                    minDate={
                      formData.startDate ? new Date(formData.startDate) : new Date()
                    }
                    onChange={(date: Date | null) => {
                      setFormData((prev) => ({
                        ...prev,
                        endDate: date ? date.toISOString() : "",
                      }));
                    }}
                    onCalendarClose={() => {
                      markTouched("endDate");
                      markTouched("startDate");
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors ${
                        showError("endDate") ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                />
              </div>
              {showError("endDate") && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* ===== FECHA DE SORTEO ===== */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
            <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5">
              Fecha del Sorteo
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-4 h-4 pointer-events-none z-10" />
              <DatePicker
                  {...datePickerProps}
                  selected={formData.drawDate ? new Date(formData.drawDate) : null}
                  minDate={
                    formData.endDate ? new Date(formData.endDate) : new Date()
                  }
                  onChange={(date: Date | null) => {
                    setFormData((prev) => ({
                      ...prev,
                      drawDate: date ? date.toISOString() : "",
                    }));
                  }}
                  onCalendarClose={() => markTouched("drawDate")}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors bg-white ${
                      showError("drawDate") ? "border-red-400 bg-red-50" : "border-amber-300"
                  }`}
              />
            </div>
            {showError("drawDate") && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.drawDate}</p>
            )}
          </div>

          {/* ===== RESTRICCIONES DE AUDIENCIA ===== */}
          <div>
            <TargetAudienceFields
                value={formData.targeting}
                onChange={handleTargetingChange}
                onBlurMinAge={() => markTouched("minAge")}
                onBlurMaxAge={() => markTouched("maxAge")}
                errors={{
                  minAge: showError("minAge") ? errors.minAge : undefined,
                  maxAge: showError("maxAge") ? errors.maxAge : undefined,
                }}
                mode="restriction"
            />
            {showError("targeting") && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.targeting}</p>
            )}
          </div>
        </form>

        {/* ===== PIE DE PÁGINA FIJO ===== */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0 z-20">
          <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="cursor-pointer flex-1 border border-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
              type="submit"
              form="edit-raffle-form"
              disabled={loading}
              className="cursor-pointer flex-1 bg-admin-gradient hover:opacity-90 text-white py-2.5 rounded-xl font-semibold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
  );
}
