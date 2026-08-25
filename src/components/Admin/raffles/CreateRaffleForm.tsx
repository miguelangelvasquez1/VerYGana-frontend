"use client";
import { CalendarDays } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getTicketEarningRulesList } from "@/services/admin/AdminRaffleService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CreatePrizeRequestDTO, PrizeType } from "@/types/raffles/prize.types";
import { CreateRaffleRequestDTO, DrawMethod, RaffleType } from "@/types/raffles/raffle.types";
import { CreateRaffleRuleRequestDTO } from "@/types/raffles/raffleRule.types";
import { TicketEarningRuleResponseDTO } from "@/types/raffles/ticketEarningRule.types";
import TargetAudienceFields, {
  isTargetAudienceValid,
} from "@/components/shared/targeting/TargetAudienceFields";

/* ================= TYPES ================= */

export interface PrizeFormState extends CreatePrizeRequestDTO {
  imageFile: File | null;
}

export type CreateRaffleFormState = Omit<CreateRaffleRequestDTO, "prizes"> & {
  prizes: PrizeFormState[];
};

export interface CreateRaffleFormSubmitPayload {
  raffleData: CreateRaffleRequestDTO;
  raffleImageFile: File;
  prizeImageFiles: File[];
}

interface Props {
  onSubmit: (payload: CreateRaffleFormSubmitPayload) => Promise<any>;
  onCancel?: () => void;
}

/* ================= SHARED STYLES ================= */

const inputCls = (error?: string | boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function CreateRaffleForm({ onSubmit, onCancel }: Props) {
  const [ticketRules, setTicketRules] = useState<TicketEarningRuleResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [raffleImageFile, setRaffleImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<CreateRaffleFormState>({
    title: "",
    description: "",
    raffleType: RaffleType.STANDARD,
    startDate: "",
    endDate: "",
    drawDate: "",
    maxTotalTickets: "" as any,
    maxTicketsPerUser: "" as any,
    requiresPet: false,
    drawMethod: DrawMethod.SYSTEM_RANDOM,
    prizes: [],
    rules: [],
    termsAndConditions: "",
    targeting: {},
  });

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /* ================= LOAD RULES ================= */

  useEffect(() => {
    const loadRules = async () => {
      const data = await getTicketEarningRulesList(undefined, true, 50, 0);
      setTicketRules(data);
    };
    loadRules();
  }, []);

  /* ================= HANDLERS ================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name } = target;

    let parsedValue: any = target.value;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      parsedValue = target.checked;
    }

    if (target instanceof HTMLInputElement && target.type === "number") {
      parsedValue = target.value === "" ? "" : Number(target.value);
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  /* ================== SANITIZADOR DE EDADES ================== */
  const handleTargetingChange = (newTargeting: Record<string, unknown>) => {
    const sanitizeAge = (val: unknown) => {
      if (val === "" || val === undefined || val === null) return "";
      const num = parseInt(String(val), 10);
      if (isNaN(num)) return "";
      if (num > 100) return 100;
      if (num < 0) return 0;
      return num;
    };

    const cleanedTargeting = {
      ...newTargeting,
      minAge: sanitizeAge(newTargeting?.minAge),
      maxAge: sanitizeAge(newTargeting?.maxAge),
    };

    setFormData((prev) => ({ ...prev, targeting: cleanedTargeting }));
  };

  /* ================= PRIZES ================= */

  const addPrize = () => {
    const newPrize: PrizeFormState = {
      title: "",
      description: "",
      brand: "",
      value: "" as any,
      prizeType: PrizeType.PHYSICAL,
      position: formData.prizes.length + 1,
      quantity: 1,
      claimCode: "",
      claimInstructions: "",
      imageFile: null,
    };
    setFormData((prev) => ({ ...prev, prizes: [...prev.prizes, newPrize] }));
  };

  const handlePrizeChange = (index: number, field: keyof PrizeFormState, value: any) => {
    const updated = [...formData.prizes];
    (updated[index] as any)[field] = value;
    setFormData((prev) => ({ ...prev, prizes: updated }));
  };

  const removePrize = (index: number) => {
    setFormData((prev) => ({ ...prev, prizes: prev.prizes.filter((_, i) => i !== index) }));
  };

  /* ================= RULES ================= */

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        { ticketEarningRuleId: "" as any, maxTicketsBySource: "" as any },
      ],
    }));
  };

  const handleRuleChange = (
    index: number,
    field: keyof CreateRaffleRuleRequestDTO,
    value: any
  ) => {
    const updated = [...formData.rules];
    (updated[index] as any)[field] = value;
    setFormData((prev) => ({ ...prev, rules: updated }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  /* ================== REGLAS DE VALIDACIÓN EN TIEMPO REAL ================== */
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const now = new Date();

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

    if (!formData.startDate) errs.startDate = "Selecciona fecha de inicio";
    if (!formData.endDate) errs.endDate = "Selecciona fecha de fin";
    if (!formData.drawDate) errs.drawDate = "Selecciona fecha de sorteo";

    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;
    const draw = formData.drawDate ? new Date(formData.drawDate) : null;

    if (start && start < now) {
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

    if (!formData.maxTotalTickets || Number(formData.maxTotalTickets) <= 0) {
      errs.maxTotalTickets = "Debe ser mayor a 0";
    }
    if (!formData.maxTicketsPerUser || Number(formData.maxTicketsPerUser) <= 0) {
      errs.maxTicketsPerUser = "Debe ser mayor a 0";
    }
    if (!(formData.termsAndConditions || "").trim()) {
      errs.termsAndConditions = "Los términos son obligatorios";
    }

    // Edades (misma restricción que en edición: mínimo 18 años)
    const minAgeRaw = formData.targeting?.minAge;
    const maxAgeRaw = formData.targeting?.maxAge;

    const hasMinAge = minAgeRaw !== undefined && minAgeRaw !== null && minAgeRaw !== "";
    const hasMaxAge = maxAgeRaw !== undefined && maxAgeRaw !== null && maxAgeRaw !== "";

    const numMin = hasMinAge ? Number(minAgeRaw) : NaN;
    const numMax = hasMaxAge ? Number(maxAgeRaw) : NaN;

    if (hasMinAge && (isNaN(numMin) || numMin < 18)) {
      errs.minAge = "La edad mínima debe ser de al menos 18 años.";
    }
    if (hasMaxAge && (isNaN(numMax) || numMax < 18)) {
      errs.maxAge = "La edad máxima debe ser de al menos 18 años.";
    }
    if (hasMinAge && hasMaxAge && !isNaN(numMin) && !isNaN(numMax) && numMax < numMin) {
      errs.maxAge = "La edad máxima no puede ser menor a la edad mínima.";
    }
    if (!isTargetAudienceValid(formData.targeting)) {
      errs.targeting = "Configuración de audiencias no válida.";
    }

    return errs;
  }, [formData]);

  const showError = (field: string) => (submitted || touched[field]) && errors[field];

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) return;

    if (!raffleImageFile) {
      alert("Debes subir la imagen principal de la rifa");
      return;
    }
    if (formData.prizes.length === 0) {
      alert("Debes agregar al menos un premio");
      return;
    }
    if (formData.prizes.some((p) => !p.imageFile)) {
      alert("Todos los premios deben tener imagen");
      return;
    }
    if (formData.rules.length === 0) {
      alert("Debes agregar al menos una regla");
      return;
    }
    if (formData.rules.some((r) => !r.ticketEarningRuleId)) {
      alert("Todas las reglas deben estar seleccionadas");
      return;
    }

    try {
      setLoading(true);

      const raffleDataForApi: CreateRaffleRequestDTO = {
        ...formData,
        maxTotalTickets: Number(formData.maxTotalTickets),
        maxTicketsPerUser: Number(formData.maxTicketsPerUser),
        prizes: formData.prizes.map(({ imageFile, ...rest }) => ({
          ...rest,
          value: Number(rest.value),
          quantity: Number(rest.quantity),
          position: Number(rest.position),
        })),
        rules: formData.rules.map((r) => ({
          ticketEarningRuleId: Number(r.ticketEarningRuleId),
          maxTicketsBySource: Number(r.maxTicketsBySource),
        })),
      };

      await onSubmit({
        raffleData: raffleDataForApi,
        raffleImageFile,
        prizeImageFiles: formData.prizes.map((p) => p.imageFile!),
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= DATEPICKER SHARED PROPS ================= */

  const datePickerProps = {
    showTimeInput: true,
    timeInputLabel: "Hora:",
    dateFormat: "dd/MM/yyyy HH:mm",
    wrapperClassName: "w-full",
    popperProps: { strategy: "fixed" as const },
    popperPlacement: "bottom-start" as const,
    popperClassName: "z-[9999]",
    calendarClassName: "shadow-2xl border-0 rounded-2xl",
    placeholderText: "dd/mm/aaaa hh:mm",
    showPopperArrow: false,
    autoComplete: "off",
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col max-h-[80vh] w-full bg-white rounded-2xl overflow-hidden">
      {/* ===== CABECERA FIJA ===== */}
      <div className="px-6 pr-12 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
        <h2 className="text-lg font-bold text-admin-navy">Crear Rifa</h2>
        <p className="text-xs text-gray-500">
          Completa la información, premios y reglas de la nueva rifa
        </p>
      </div>

      {/* ===== CUERPO DEL FORMULARIO CON SCROLL ===== */}
      <form
        id="create-raffle-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {/* Título */}
        <div>
          <label className={labelCls}>Título</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => markTouched("title")}
            placeholder="Nombre de la rifa"
            className={inputCls(showError("title"))}
            required
          />
          {showError("title") && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={() => markTouched("description")}
            rows={3}
            placeholder="Describe la rifa brevemente..."
            className={`${inputCls(showError("description"))} resize-none`}
            required
          />
          {showError("description") && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        {/* Tipo + Método */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo de Rifa</label>
            <select
              name="raffleType"
              value={formData.raffleType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors bg-white cursor-pointer"
            >
              <option value="STANDARD">Estándar</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Método de Sorteo</label>
            <select
              name="drawMethod"
              value={formData.drawMethod}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors bg-white cursor-pointer"
            >
              <option value="SYSTEM_RANDOM">Sistema interno</option>
              <option value="RANDOM_ORG">Random.org</option>
            </select>
          </div>
        </div>

        {/* ──── Fechas ──── */}
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
                onChange={(date: Date | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: date ? date.toISOString() : "",
                  }))
                }
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
                minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                onChange={(date: Date | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    endDate: date ? date.toISOString() : "",
                  }))
                }
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

        {/* Fecha Sorteo — ancho completo con énfasis visual */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
          <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5">
            Fecha del Sorteo
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-4 h-4 pointer-events-none z-10" />
            <DatePicker
              {...datePickerProps}
              selected={formData.drawDate ? new Date(formData.drawDate) : null}
              minDate={formData.endDate ? new Date(formData.endDate) : new Date()}
              onChange={(date: Date | null) =>
                setFormData((prev) => ({
                  ...prev,
                  drawDate: date ? date.toISOString() : "",
                }))
              }
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

        {/* Tickets */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Máximo Tickets Totales</label>
            <input
              type="number"
              name="maxTotalTickets"
              value={formData.maxTotalTickets}
              onChange={handleChange}
              onBlur={() => markTouched("maxTotalTickets")}
              placeholder="Ej: 1000"
              min={1}
              className={inputCls(showError("maxTotalTickets"))}
              required
            />
            {showError("maxTotalTickets") && (
              <p className="text-red-500 text-xs mt-1">{errors.maxTotalTickets}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Máximo Tickets por Usuario</label>
            <input
              type="number"
              name="maxTicketsPerUser"
              value={formData.maxTicketsPerUser}
              onChange={handleChange}
              onBlur={() => markTouched("maxTicketsPerUser")}
              placeholder="Ej: 10"
              min={1}
              className={inputCls(showError("maxTicketsPerUser"))}
              required
            />
            {showError("maxTicketsPerUser") && (
              <p className="text-red-500 text-xs mt-1">{errors.maxTicketsPerUser}</p>
            )}
          </div>
        </div>

        {/* Términos y condiciones */}
        <div>
          <label className={labelCls}>Términos y Condiciones</label>
          <textarea
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleChange}
            onBlur={() => markTouched("termsAndConditions")}
            rows={4}
            placeholder="Escribe aquí los términos y condiciones de la rifa..."
            className={`${inputCls(showError("termsAndConditions"))} resize-none`}
            required
          />
          {showError("termsAndConditions") && (
            <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>
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

        {/* ═══════════════ IMAGEN RIFA ═══════════════ */}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-admin-blue/10 to-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🖼️</span>
              <h2 className="text-lg font-bold text-gray-800">Imagen de la Rifa</h2>
            </div>
          </div>

          <div className="p-6">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-admin-blue hover:bg-admin-blue/5 transition-all group">
              {raffleImageFile ? (
                <div className="text-center">
                  <img
                    src={URL.createObjectURL(raffleImageFile)}
                    alt="preview"
                    className="h-48 object-contain mb-3 rounded-lg"
                  />
                  <p className="text-sm text-gray-500">Haz clic para cambiar la imagen</p>
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-semibold text-gray-600 group-hover:text-admin-blue transition-colors">
                    Inserta la imagen principal
                  </p>
                  <p className="text-sm mt-1">PNG, JPG o WEBP</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setRaffleImageFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </section>

        {/* ═══════════════ PREMIOS ═══════════════ */}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-admin-gold/10 to-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-admin-gold text-white font-bold text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-lg font-bold text-gray-800">Premios</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {formData.prizes.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-sm">Agrega al menos un premio para continuar</p>
              </div>
            )}

            {formData.prizes.map((prize, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Prize header */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-admin-gold/10 text-admin-gold text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {prize.title || `Premio ${index + 1}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="cursor-pointer text-red-400 hover:text-red-600 flex gap-1 items-center text-sm transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className={labelCls}>Título del Premio</label>
                    <input
                      value={prize.title}
                      onChange={(e) => handlePrizeChange(index, "title", e.target.value)}
                      placeholder="Nombre del premio"
                      className={inputCls()}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Descripción</label>
                    <textarea
                      value={prize.description}
                      onChange={(e) => handlePrizeChange(index, "description", e.target.value)}
                      rows={2}
                      placeholder="Describe el premio..."
                      className={`${inputCls()} resize-none`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Marca</label>
                      <input
                        value={prize.brand}
                        onChange={(e) => handlePrizeChange(index, "brand", e.target.value)}
                        placeholder="Marca del producto"
                        className={inputCls()}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Tipo de Premio</label>
                      <select
                        value={prize.prizeType}
                        onChange={(e) => handlePrizeChange(index, "prizeType", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors bg-white"
                      >
                        <option value="PHYSICAL">Físico</option>
                        <option value="DIGITAL">Digital</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Valor ($)</label>
                      <input
                        type="number"
                        value={prize.value}
                        onChange={(e) =>
                          handlePrizeChange(index, "value", Number(e.target.value))
                        }
                        placeholder="0"
                        min={0}
                        className={inputCls()}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Cantidad</label>
                      <input
                        type="number"
                        value={prize.quantity}
                        onChange={(e) =>
                          handlePrizeChange(index, "quantity", Number(e.target.value))
                        }
                        placeholder="1"
                        min={1}
                        className={inputCls()}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Posición</label>
                      <input
                        type="number"
                        value={prize.position}
                        onChange={(e) =>
                          handlePrizeChange(index, "position", Number(e.target.value))
                        }
                        placeholder="1"
                        min={1}
                        className={inputCls()}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`${labelCls} mb-2`}>Imagen del Premio</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-admin-blue hover:bg-admin-blue/5 transition-all group">
                      {prize.imageFile ? (
                        <div className="text-center">
                          <img
                            src={URL.createObjectURL(prize.imageFile)}
                            alt="preview"
                            className="h-32 object-contain mb-2 rounded-lg"
                          />
                          <p className="text-xs text-gray-500">Haz clic para cambiar</p>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center">
                          <p className="text-2xl mb-1">📸</p>
                          <p className="text-sm font-medium group-hover:text-admin-blue transition-colors">
                            Subir imagen del premio
                          </p>
                          <p className="text-xs mt-0.5">PNG, JPG o WEBP</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handlePrizeChange(index, "imageFile", e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label className={labelCls}>Código de Reclamo</label>
                    <input
                      value={prize.claimCode}
                      onChange={(e) => handlePrizeChange(index, "claimCode", e.target.value)}
                      placeholder="Código para reclamar el premio"
                      className={inputCls()}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Instrucciones de Reclamo</label>
                    <textarea
                      value={prize.claimInstructions}
                      onChange={(e) =>
                        handlePrizeChange(index, "claimInstructions", e.target.value)
                      }
                      rows={2}
                      placeholder="¿Cómo puede reclamar el ganador este premio?"
                      className={`${inputCls()} resize-none`}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPrize}
              className="cursor-pointer w-full border-2 border-dashed border-admin-gold/40 hover:border-admin-gold hover:bg-admin-gold/5 text-admin-gold px-4 py-3 rounded-xl text-sm font-semibold flex gap-2 items-center justify-center transition-colors"
            >
              <Plus size={15} />
              Agregar Premio
            </button>
          </div>
        </section>

        {/* ═══════════════ REGLAS ═══════════════ */}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-admin-midnight/10 to-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-admin-midnight text-white font-bold text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-lg font-bold text-gray-800">Reglas</h2>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {formData.rules.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">Agrega al menos una regla de tickets</p>
              </div>
            )}

            {formData.rules.map((rule, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-admin-midnight/10 text-admin-midnight text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">Regla #{index + 1}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Regla de tickets</label>
                    <select
                      value={rule.ticketEarningRuleId}
                      onChange={(e) =>
                        handleRuleChange(index, "ticketEarningRuleId", Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors bg-white"
                      required
                    >
                      <option value="">Seleccionar regla</option>
                      {ticketRules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.ruleName} ({r.ruleType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Máx. tickets por fuente</label>
                    <input
                      type="number"
                      placeholder="Ej: 5"
                      value={rule.maxTicketsBySource}
                      onChange={(e) =>
                        handleRuleChange(index, "maxTicketsBySource", Number(e.target.value))
                      }
                      min={1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="cursor-pointer text-red-400 hover:text-red-600 flex gap-1 items-center text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar regla
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRule}
              className="cursor-pointer w-full border-2 border-dashed border-admin-midnight/30 hover:border-admin-midnight hover:bg-admin-midnight/5 text-admin-midnight px-4 py-3 rounded-xl text-sm font-semibold flex gap-2 items-center justify-center transition-colors"
            >
              <Plus size={15} />
              Agregar Regla
            </button>
          </div>
        </section>
      </form>

      {/* ===== PIE DE PÁGINA FIJO ===== */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0 z-20">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 border border-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          form="create-raffle-form"
          disabled={loading}
          className="cursor-pointer flex-1 bg-admin-gradient hover:opacity-90 text-white py-2.5 rounded-xl font-semibold text-sm shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Creando rifa..." : "Crear Rifa"}
        </button>
      </div>
    </div>
  );
}
