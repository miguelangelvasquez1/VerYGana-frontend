"use client";
import { CalendarDays } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getTicketEarningRulesList } from "@/services/admin/AdminRaffleService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CreatePrizeRequestDTO } from "@/types/raffles/prize.types";
import { CreateRaffleRequestDTO } from "@/types/raffles/raffle.types";
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

export default function CreateRaffleForm({ onSubmit }: Props) {
  const [ticketRules, setTicketRules] = useState<
    TicketEarningRuleResponseDTO[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [raffleImageFile, setRaffleImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<CreateRaffleFormState>({
    title: "",
    description: "",
    raffleType: "STANDARD",
    startDate: "",
    endDate: "",
    drawDate: "",
    maxTotalTickets: "" as any,
    maxTicketsPerUser: "" as any,
    requiresPet: false,
    drawMethod: "SYSTEM_RANDOM",
    prizes: [],
    rules: [],
    termsAndConditions: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ================= LOAD RULES ================= */

  useEffect(() => {
    const loadRules = async () => {
      const data = await getTicketEarningRulesList(
        undefined,
        true,
        50,
        0
      );
      setTicketRules(data);
    };

    loadRules();
  }, []);

  /* ================= HANDLERS ================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name } = target;

    let parsedValue: any = target.value;

    if (
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
    ) {
      parsedValue = target.checked;
    }

    if (
      target instanceof HTMLInputElement &&
      target.type === "number"
    ) {
      parsedValue =
        target.value === "" ? "" : Number(target.value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  /* ================= PRIZES ================= */

  const addPrize = () => {
    const newPrize: PrizeFormState = {
      title: "",
      description: "",
      brand: "",
      value: "" as any,
      prizeType: "PHYSICAL",
      position: formData.prizes.length + 1,
      quantity: 1,
      requiresShipping: false,
      estimatedDeliveryDays: "" as any,
      redemptionInstructions: "",
      imageFile: null,
    };

    setFormData((prev) => ({
      ...prev,
      prizes: [...prev.prizes, newPrize],
    }));
  };

  const handlePrizeChange = (
    index: number,
    field: keyof PrizeFormState,
    value: any
  ) => {
    const updated = [...formData.prizes];
    (updated[index] as any)[field] = value;

    setFormData((prev) => ({
      ...prev,
      prizes: updated,
    }));
  };

  const removePrize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };

  /* ================= RULES ================= */

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          ticketEarningRuleId: "" as any,
          maxTicketsBySource: "" as any,
        },
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

    setFormData((prev) => ({
      ...prev,
      rules: updated,
    }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "El título es obligatorio";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es obligatoria";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Debes seleccionar fecha de inicio";
    }

    if (!formData.endDate) {
      newErrors.endDate = "Debes seleccionar fecha de fin";
    }

    if (!formData.drawDate) {
      newErrors.drawDate = "Debes seleccionar fecha de sorteo";
    }

    if (!formData.maxTotalTickets || Number(formData.maxTotalTickets) <= 0) {
      newErrors.maxTotalTickets = "Debe ser mayor a 0";
    }

    if (!formData.maxTicketsPerUser || Number(formData.maxTicketsPerUser) <= 0) {
      newErrors.maxTicketsPerUser = "Debe ser mayor a 0";
    }

    if (!formData.termsAndConditions.trim()) {
      newErrors.termsAndConditions = "Los términos son obligatorios";
    }

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

        prizes: formData.prizes.map(
          ({ imageFile, ...rest }) => ({
            ...rest,
            value: Number(rest.value),
            quantity: Number(rest.quantity),
            position: Number(rest.position),
            estimatedDeliveryDays:
              rest.estimatedDeliveryDays === null
                ? null
                : Number(rest.estimatedDeliveryDays),
          })
        ),

        rules: formData.rules.map((r) => ({
          ticketEarningRuleId: Number(
            r.ticketEarningRuleId
          ),
          maxTicketsBySource: Number(
            r.maxTicketsBySource
          ),
        })),
      };

      await onSubmit({
        raffleData: raffleDataForApi,
        raffleImageFile,
        prizeImageFiles: formData.prizes.map(
          (p) => p.imageFile!
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10"
    >
      {/* ================= DATOS BASICOS ================= */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-2xl font-bold">
          1️⃣ Datos Básicos
        </h2>

        <div>
          <label className="block font-medium">
            Título
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full border p-2 rounded mt-1 ${errors.title ? "border-red-500" : ""
              }`}
            required
          />
        </div>

        <div>
          <label className="block font-medium">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full border p-2 rounded mt-1 ${errors.description ? "border-red-500" : ""
              }`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Tipo de Rifa</label>
            <select
              name="raffleType"
              value={formData.raffleType}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="STANDARD">
                Estándar
              </option>
              <option value="PREMIUM">
                Premium
              </option>
            </select>
          </div>

          <div>
            <label>Método de Sorteo</label>
            <select
              name="drawMethod"
              value={formData.drawMethod}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="SYSTEM_RANDOM">
                Sistema interno
              </option>
              <option value="RANDOM_ORG">
                Random.org
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>
              Inicio de inscripciones
            </label>
            <DatePicker
              selected={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date: Date | null) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: date ? date.toISOString() : "",
                }))
              }
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              className={`w-full border p-2 rounded ${errors.startDate ? "border-red-500" : ""
                }`}
              placeholderText="Selecciona fecha y hora"
            />

            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.startDate}
              </p>
            )}
          </div>

          <div>
            <label>
              Fin de inscripciones
            </label>
            <DatePicker
              selected={formData.endDate ? new Date(formData.endDate) : null}
              onChange={(date: Date | null) =>
                setFormData((prev) => ({
                  ...prev,
                  endDate: date ? date.toISOString() : "",
                }))
              }
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              className={`w-full border p-2 rounded ${errors.endDate ? "border-red-500" : ""
                }`}
              placeholderText="Selecciona fecha y hora"
            />

            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.endDate}
              </p>
            )}
          </div>

          <div>
            <label>Fecha Sorteo</label>
            <div className="relative w-full">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />

              <DatePicker
                selected={formData.drawDate ? new Date(formData.drawDate) : null}
                onChange={(date: Date | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    drawDate: date ? date.toISOString() : "",
                  }))
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                popperClassName="z-50"
                calendarClassName="rounded-2xl border border-gray-200 shadow-2xl p-3"
                dayClassName={() =>
                  "hover:bg-black hover:text-white rounded-lg transition-all duration-200"
                }
                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/70 backdrop-blur-md shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${errors.drawDate
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200"
                  }`}
                placeholderText="Selecciona fecha y hora"
              />
            </div>

            {errors.drawDate && (
              <p className="text-red-500 text-sm mt-2">
                {errors.drawDate}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>
              Máximo Tickets Totales
            </label>
            <input
              type="number"
              name="maxTotalTickets"
              value={formData.maxTotalTickets}
              onChange={handleChange}
              className={`w-full border p-2 rounded mt-1 ${errors.maxTotalTickets ? "border-red-500" : ""
                }`}
              required
            />
          </div>

          <div>
            <label>
              Máximo Tickets por Usuario
            </label>
            <input
              type="number"
              name="maxTicketsPerUser"
              value={formData.maxTicketsPerUser}
              onChange={handleChange}
              className={`w-full border p-2 rounded mt-1 ${errors.maxTicketsPerUser ? "border-red-500" : ""
                }`}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="requiresPet"
            checked={formData.requiresPet}
            onChange={handleChange}
          />
          Requiere mascota registrada
        </label>

        <div>
          <label>
            Términos y Condiciones
          </label>
          <textarea
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleChange}
            className={`w-full border p-2 rounded mt-1 ${errors.termsAndConditions ? "border-red-500" : ""
              }`}
            required
          />
        </div>
      </div>

      {/* ================= IMAGEN RIFA ================= */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-2xl font-bold">
          🖼️ Imagen de la Rifa
        </h2>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-purple-500 transition">
          {raffleImageFile ? (
            <img
              src={URL.createObjectURL(
                raffleImageFile
              )}
              alt="preview"
              className="h-40 object-contain mb-3"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p className="font-medium">
                📸 Inserta la imagen principal
              </p>
              <p className="text-sm">
                PNG, JPG o WEBP
              </p>
            </div>
          )}

          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) =>
              setRaffleImageFile(
                e.target.files?.[0] || null
              )
            }
          />
        </label>
      </div>

      {/* ================= PREMIOS ================= */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            2️⃣ Premios
          </h2>

          <button
            type="button"
            onClick={addPrize}
            className="bg-purple-600 text-white px-4 py-2 rounded flex gap-2 items-center"
          >
            <Plus size={16} />
            Agregar Premio
          </button>
        </div>

        {formData.prizes.map(
          (prize, index) => (
            <div
              key={index}
              className="border p-6 rounded-xl space-y-4 bg-gray-50"
            >
              <div>
                <label className="block font-medium">
                  Título del Premio
                </label>
                <input
                  value={prize.title}
                  onChange={(e) =>
                    handlePrizeChange(
                      index,
                      "title",
                      e.target.value
                    )
                  }
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div>
                <label className="block font-medium">
                  Descripción
                </label>
                <textarea
                  value={prize.description}
                  onChange={(e) =>
                    handlePrizeChange(
                      index,
                      "description",
                      e.target.value
                    )
                  }
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Marca</label>
                  <input
                    value={prize.brand}
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "brand",
                        e.target.value
                      )
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label>
                    Tipo de Premio
                  </label>
                  <select
                    value={prize.prizeType}
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "prizeType",
                        e.target.value
                      )
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="PHYSICAL">
                      Físico
                    </option>
                    <option value="DIGITAL">
                      Digital
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Valor</label>
                  <input
                    type="number"
                    value={prize.value}
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "value",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>

                <div>
                  <label>
                    Cantidad disponible
                  </label>
                  <input
                    type="number"
                    value={prize.quantity}
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label>
                  Posición (orden del premio)
                </label>
                <input
                  type="number"
                  value={prize.position}
                  onChange={(e) =>
                    handlePrizeChange(
                      index,
                      "position",
                      Number(e.target.value)
                    )
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={prize.requiresShipping}
                  onChange={(e) =>
                    handlePrizeChange(
                      index,
                      "requiresShipping",
                      e.target.checked
                    )
                  }
                />
                <label>
                  Requiere envío físico
                </label>
              </div>

              {prize.requiresShipping && (
                <div>
                  <label>
                    Días estimados de entrega
                  </label>
                  <input
                    type="number"
                    value={
                      prize.estimatedDeliveryDays ??
                      0
                    }
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "estimatedDeliveryDays",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-2">
                  Imagen del Premio
                </label>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-purple-500 transition">
                  {prize.imageFile ? (
                    <img
                      src={URL.createObjectURL(
                        prize.imageFile
                      )}
                      alt="preview"
                      className="h-40 object-contain mb-3"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <p className="font-medium">
                        📸 Inserta la imagen del premio aquí
                      </p>
                      <p className="text-sm">
                        PNG, JPG o WEBP
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      handlePrizeChange(
                        index,
                        "imageFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label className="block font-medium">
                  Instrucciones para reclamar el premio
                </label>
                <textarea
                  value={prize.redemptionInstructions}
                  onChange={(e) =>
                    handlePrizeChange(
                      index,
                      "redemptionInstructions",
                      e.target.value
                    )
                  }
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  removePrize(index)
                }
                className="text-red-500 flex gap-2 items-center mt-2"
              >
                <Trash2 size={16} />
                Eliminar Premio
              </button>
            </div>
          )
        )}
      </div>

      {/* ================= REGLAS ================= */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            3️⃣ Reglas
          </h2>

          <button
            type="button"
            onClick={addRule}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex gap-2 items-center"
          >
            <Plus size={16} />
            Agregar Regla
          </button>
        </div>

        {formData.rules.map(
          (rule, index) => (
            <div
              key={index}
              className="border p-4 rounded space-y-3"
            >
              <select
                value={
                  rule.ticketEarningRuleId
                }
                onChange={(e) =>
                  handleRuleChange(
                    index,
                    "ticketEarningRuleId",
                    Number(e.target.value)
                  )
                }
                className="w-full border p-2 rounded"
                required
              >
                <option value="">
                  Seleccionar regla
                </option>

                {ticketRules.map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                  >
                    {r.ruleName} (
                    {r.ruleType})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Max tickets por esta fuente"
                value={
                  rule.maxTicketsBySource
                }
                onChange={(e) =>
                  handleRuleChange(
                    index,
                    "maxTicketsBySource",
                    Number(e.target.value)
                  )
                }
                className="w-full border p-2 rounded"
                required
              />

              <button
                type="button"
                onClick={() =>
                  removeRule(index)
                }
                className="text-red-500 flex gap-1 items-center"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          )
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading
          ? "Creando rifa..."
          : "Crear Rifa"}
      </button>
    </form>
  );
}