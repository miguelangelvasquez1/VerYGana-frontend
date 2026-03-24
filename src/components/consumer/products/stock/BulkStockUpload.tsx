"use client";

import { useState } from "react";
import { addBulkStockItems } from "@/services/ProductService";

interface Props {
  productId: number;
  onSuccess: () => void;
}

export default function BulkStockUpload({ productId, onSuccess }: Props) {
  const [text, setText] = useState("");

  const handleUpload = async () => {
    const lines = text.split("\n").filter(Boolean);

    const payload = lines.map((line) => ({
      code: line.trim(),
      additionalInfo: "",
      expirationDate: null,
    }));

    await addBulkStockItems(productId, payload);
    setText("");
    onSuccess();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h3 className="text-lg font-semibold">
        Carga masiva de códigos
      </h3>

      <textarea
        rows={6}
        className="w-full border p-2 rounded"
        placeholder="Un código por línea"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleUpload}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Cargar códigos
      </button>
    </div>
  );
}
