"use client";

import { useState } from "react";
import { addStockItem } from "@/services/ProductService";
import { ProductStockRequestDTO } from "@/types/products/ProductStock.types";

interface Props {
  productId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({
  productId,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<ProductStockRequestDTO>({
    code: "",
    additionalInfo: "",
    expirationDate: null,
  });

  const handleSubmit = async () => {
    await addStockItem(productId, form);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold">Agregar código</h3>

        <input
          placeholder="Código"
          className="w-full border p-2 rounded"
          value={form.code}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value })
          }
        />

        <input
          placeholder="Info adicional"
          className="w-full border p-2 rounded"
          value={form.additionalInfo}
          onChange={(e) =>
            setForm({ ...form, additionalInfo: e.target.value })
          }
        />

        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({
              ...form,
              expirationDate: e.target.value || null,
            })
          }
        />

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
