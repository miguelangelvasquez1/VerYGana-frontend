"use client";
import { CalendarDays } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getTicketEarningRulesList } from "@/services/admin/AdminRaffleService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CreatePrizeRequestDTO, PrizeType } from "@/types/raffles/prize.types";
import { CreateRaffleRequestDTO, DrawMethod, RaffleType } from "@/types/raffles/raffle.types";
import { CreateRaffleRuleRequestDTO } from "@/types/raffles/raffleRule.types";
import { TicketEarningRuleResponseDTO } from "@/types/raffles/ticketEarningRule.types";

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
}

/* ================= SHARED STYLES ================= */

const inputCls = (error?: string) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function CreateRaffleForm({ onSubmit }: Props) {
  const [ticketRules, setTicketRules] = useState<TicketEarningRuleResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      requiresShipping: false,
      estimatedDeliveryDays: "" as any,
      redemptionInstructions: "",
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

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "El título es obligatorio";
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria";
    if (!formData.startDate) newErrors.startDate = "Debes seleccionar fecha de inicio";
    if (!formData.endDate) newErrors.endDate = "Debes seleccionar fecha de fin";
    if (!formData.drawDate) newErrors.drawDate = "Debes seleccionar fecha de sorteo";
    if (!formData.maxTotalTickets || Number(formData.maxTotalTickets) <= 0)
      newErrors.maxTotalTickets = "Debe ser mayor a 0";
    if (!formData.maxTicketsPerUser || Number(formData.maxTicketsPerUser) <= 0)
      newErrors.maxTicketsPerUser = "Debe ser mayor a 0";
    if (!formData.termsAndConditions.trim())
      newErrors.termsAndConditions = "Los términos son obligatorios";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;
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
          estimatedDeliveryDays:
            rest.estimatedDeliveryDays === null ? null : Number(rest.estimatedDeliveryDays),
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
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ═══════════════ DATOS BÁSICOS ═══════════════ */}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-r from-purple-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
              1
            </span>
            <h2 className="text-lg font-bold text-gray-800">Datos Básicos</h2>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Título */}
          <div>
            <label className={labelCls}>Título</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nombre de la rifa"
              className={inputCls(errors.title)}
              required
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe la rifa brevemente..."
              className={`${inputCls(errors.description)} resize-none`}
              required
            />
            {errors.description && (
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="SYSTEM_RANDOM">Sistema interno</option>
                <option value="RANDOM_ORG">Random.org</option>
              </select>
            </div>
          </div>

          {/* ──── Fechas ──── */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">Fechas</p>

            {/* Inicio + Fin en 2 columnas */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Inicio de inscripciones
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                  <DatePicker
                    {...datePickerProps}
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date: Date | null) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: date ? date.toISOString() : "",
                      }))
                    }
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      errors.startDate ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.startDate && (
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
                    onChange={(date: Date | null) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: date ? date.toISOString() : "",
                      }))
                    }
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      errors.endDate ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Fecha Sorteo — ancho completo con énfasis visual */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                Fecha del Sorteo
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4 pointer-events-none z-10" />
                <DatePicker
                  {...datePickerProps}
                  selected={formData.drawDate ? new Date(formData.drawDate) : null}
                  onChange={(date: Date | null) =>
                    setFormData((prev) => ({
                      ...prev,
                      drawDate: date ? date.toISOString() : "",
                    }))
                  }
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors bg-white ${
                    errors.drawDate ? "border-red-400" : "border-amber-300"
                  }`}
                />
              </div>
              {errors.drawDate && (
                <p className="text-red-500 text-xs mt-1">{errors.drawDate}</p>
              )}
            </div>
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
                placeholder="Ej: 1000"
                min={1}
                className={inputCls(errors.maxTotalTickets)}
                required
              />
              {errors.maxTotalTickets && (
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
                placeholder="Ej: 10"
                min={1}
                className={inputCls(errors.maxTicketsPerUser)}
                required
              />
              {errors.maxTicketsPerUser && (
                <p className="text-red-500 text-xs mt-1">{errors.maxTicketsPerUser}</p>
              )}
            </div>
          </div>

          {/* Toggle: Requiere mascota */}
          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative shrink-0">
              <input
                type="checkbox"
                name="requiresPet"
                checked={formData.requiresPet}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                  formData.requiresPet ? "bg-purple-600" : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  formData.requiresPet ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 select-none">
              Requiere mascota registrada
            </span>
          </label>

          {/* Términos y condiciones */}
          <div>
            <label className={labelCls}>Términos y Condiciones</label>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              rows={4}
              placeholder="Escribe aquí los términos y condiciones de la rifa..."
              className={`${inputCls(errors.termsAndConditions)} resize-none`}
              required
            />
            {errors.termsAndConditions && (
              <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>
            )}
          </div>

        </div>
      </section>

      {/* ═══════════════ IMAGEN RIFA ═══════════════ */}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">🖼️</span>
            <h2 className="text-lg font-bold text-gray-800">Imagen de la Rifa</h2>
          </div>
        </div>

        <div className="p-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group">
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
                <p className="font-semibold text-gray-600 group-hover:text-purple-600 transition-colors">
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
        <div className="bg-linear-to-r from-purple-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-lg font-bold text-gray-800">Premios</h2>
            </div>
            <button
              type="button"
              onClick={addPrize}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center transition-colors"
            >
              <Plus size={15} />
              Agregar Premio
            </button>
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
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {prize.title || `Premio ${index + 1}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePrize(index)}
                  className="text-red-400 hover:text-red-600 flex gap-1 items-center text-sm transition-colors"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
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

                {/* Toggle: Requiere envío */}
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={prize.requiresShipping}
                      onChange={(e) =>
                        handlePrizeChange(index, "requiresShipping", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                        prize.requiresShipping ? "bg-purple-600" : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        prize.requiresShipping ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 select-none">
                    Requiere envío físico
                  </span>
                </label>

                {prize.requiresShipping && (
                  <div>
                    <label className={labelCls}>Días estimados de entrega</label>
                    <input
                      type="number"
                      value={prize.estimatedDeliveryDays ?? 0}
                      onChange={(e) =>
                        handlePrizeChange(
                          index,
                          "estimatedDeliveryDays",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Ej: 5"
                      min={0}
                      className={inputCls()}
                    />
                  </div>
                )}

                <div>
                  <label className={`${labelCls} mb-2`}>Imagen del Premio</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group">
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
                        <p className="text-sm font-medium group-hover:text-purple-600 transition-colors">
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
                  <label className={labelCls}>Instrucciones para reclamar el premio</label>
                  <textarea
                    value={prize.redemptionInstructions}
                    onChange={(e) =>
                      handlePrizeChange(index, "redemptionInstructions", e.target.value)
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
        </div>
      </section>

      {/* ═══════════════ REGLAS ═══════════════ */}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-lg font-bold text-gray-800">Reglas</h2>
            </div>
            <button
              type="button"
              onClick={addRule}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center transition-colors"
            >
              <Plus size={15} />
              Agregar Regla
            </button>
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
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeRule(index)}
                className="text-red-400 hover:text-red-600 flex gap-1 items-center text-sm transition-colors"
              >
                <Trash2 size={14} />
                Eliminar regla
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ SUBMIT ═══════════════ */}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Creando rifa..." : "✓ Crear Rifa"}
      </button>

    </form>
  );
}
