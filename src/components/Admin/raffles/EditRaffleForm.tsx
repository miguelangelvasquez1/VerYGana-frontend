"use client";
import { CalendarDays } from "lucide-react";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { RaffleResponseDTO, RaffleType, UpdateRaffleRequestDTO } from "@/types/raffles/raffle.types";
import TargetAudienceFields, {
  isTargetAudienceValid,
} from "@/components/shared/targeting/TargetAudienceFields";

interface Props {
  raffle: RaffleResponseDTO;
  onSubmit: (data: UpdateRaffleRequestDTO) => Promise<any>;
  onCancel: () => void;
}

const inputCls = (error?: string) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function EditRaffleForm({ raffle, onSubmit, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateRaffleRequestDTO>({
    title: raffle.title,
    description: raffle.description,
    raffleType: raffle.raffleType,
    requiresPet: raffle.requiresPet,
    startDate: raffle.startDate,
    endDate: raffle.endDate,
    drawDate: raffle.drawDate,
    targeting: raffle.targeting ?? {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name } = target;

    let parsedValue: any = target.value;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      parsedValue = target.checked;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "El título es obligatorio";
    if (!formData.description.trim()) newErrors.description = "La descripción es obligatoria";
    if (!formData.startDate) newErrors.startDate = "Debes seleccionar fecha de inicio";
    if (!formData.endDate) newErrors.endDate = "Debes seleccionar fecha de fin";
    if (!formData.drawDate) newErrors.drawDate = "Debes seleccionar fecha de sorteo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!isTargetAudienceValid(formData.targeting)) {
      alert("En Disponibilidad: la edad máxima debe ser mayor o igual a la mínima");
      return;
    }

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
    popperProps: { strategy: "fixed" as const },
    popperPlacement: "bottom-start" as const,
    popperClassName: "z-[9999]",
    calendarClassName: "shadow-2xl border-0 rounded-2xl",
    placeholderText: "dd/mm/aaaa hh:mm",
    showPopperArrow: false,
    autoComplete: "off",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Editar Rifa</h2>

      <div>
        <label className={labelCls}>Título</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={inputCls(errors.title)}
          required
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className={`${inputCls(errors.description)} resize-none`}
          required
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>Tipo de Rifa</label>
        <select
          name="raffleType"
          value={formData.raffleType}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
        >
          <option value={RaffleType.STANDARD}>Estándar</option>
          <option value={RaffleType.PREMIUM}>Premium</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
                setFormData((prev) => ({ ...prev, startDate: date ? date.toISOString() : "" }))
              }
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                errors.startDate ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
          </div>
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
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
                setFormData((prev) => ({ ...prev, endDate: date ? date.toISOString() : "" }))
              }
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                errors.endDate ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
          </div>
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>

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
              setFormData((prev) => ({ ...prev, drawDate: date ? date.toISOString() : "" }))
            }
            className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors bg-white ${
              errors.drawDate ? "border-red-400" : "border-amber-300"
            }`}
          />
        </div>
        {errors.drawDate && <p className="text-red-500 text-xs mt-1">{errors.drawDate}</p>}
      </div>

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

      <TargetAudienceFields
        value={formData.targeting}
        onChange={(targeting) => setFormData((prev) => ({ ...prev, targeting }))}
        mode="restriction"
      />

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 border border-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
