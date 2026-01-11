"use client";

import { Trash2 } from "lucide-react";
import { ProductStockResponseDTO } from "@/types/products/ProductStock.types";

interface Props {
  items: ProductStockResponseDTO[];
  onDelete: (stockId: number) => void;
}

export default function ProductStockTable({ items, onDelete }: Props) {
  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Código</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Creado</th>
            <th className="p-3">Vendido</th>
            <th className="p-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3 font-mono">{item.code}</td>
              <td className="p-3">{item.status}</td>
              <td className="p-3">
                {new Date(item.createdAt).toLocaleString()}
              </td>
              <td className="p-3">
                {item.soldAt
                  ? new Date(item.soldAt).toLocaleString()
                  : "-"}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar código"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
