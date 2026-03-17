"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => Promise<void> | void;
  onClose: () => void;

  requireTextConfirmation?: boolean;
  confirmationText?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  requireTextConfirmation = false,
  confirmationText,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTextValid =
    !requireTextConfirmation ||
    (confirmationText && inputValue === confirmationText);

  const handleConfirm = async () => {
    if (!isTextValid) {
      toast.error("Debes escribir el texto de confirmación correctamente");
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Ocurrió un error al ejecutar la acción"
      );
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500";
      default:
        return "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}

        {/* Critical confirmation input */}
        {requireTextConfirmation && confirmationText && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Para confirmar, escribe:
              <span className="ml-1 font-semibold text-red-600">
                {confirmationText}
              </span>
            </p>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Escribe aquí..."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading || !isTextValid}
            className={`px-4 py-2 rounded-lg text-white transition focus:ring-2 ${getButtonStyle()} disabled:opacity-50`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
