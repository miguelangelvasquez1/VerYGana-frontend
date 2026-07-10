"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { createPqrs } from "@/services/PqrsService";
import { PqrsType } from "@/types/Pqrs.types";
import { pqrsTypeLabel } from "./pqrsMeta";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const DESCRIPTION_MAX = 1000;

const CreatePqrsModal = ({ onClose, onCreated }: Props) => {
  const [type, setType] = useState<PqrsType>(PqrsType.PETICION);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createPqrs({ type, subject: subject.trim(), description: description.trim() });
      toast.success("Tu solicitud fue enviada correctamente");
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nueva solicitud de PQRS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de solicitud</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PqrsType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(PqrsType).map((t) => (
                <option key={t} value={t}>
                  {pqrsTypeLabel[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              placeholder="Ej: No me llega el dinero de mis ventas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={DESCRIPTION_MAX}
              placeholder="Cuéntanos con detalle qué sucedió..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <span className="text-xs text-gray-400 float-right">
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#03548C] rounded-lg hover:bg-[#024270] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Enviar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePqrsModal;
