"use client";

import { useEffect, useState } from "react";
import AddStockModal from "./AddStockModal";
import BulkStockUpload from "./BulkStockUpload";
import ProductStockTable from "./ProductStockTable";
import { getProductStock } from "@/services/ProductService";
import { deleteStockItem } from "@/services/ProductService";
import { ProductStockResponseDTO } from "@/types/products/ProductStock.types";
import { ProductStockParams } from "@/types/products/ProductStock.types";

interface Props {
  productId: number;
}

export default function ProductStockSection({ productId }: Props) {
  const [items, setItems] = useState<ProductStockResponseDTO[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);


  const loadStock = async (pageNumber = page) => {
    const params: ProductStockParams = {
      page: pageNumber,
      size: 20,
    };

    const response = await getProductStock(productId, params);

    setItems(response.data);
    setTotalPages(response.meta.totalPages);
    setPage(pageNumber);
  };

  const handleDeleteStock = async (stockId: number) => {
    if (!confirm("¿Eliminar este código?")) return;

    try {
      await deleteStockItem(productId, stockId);
      loadStock();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar código");
    }
  };


  useEffect(() => {
    loadStock();
  }, [productId]);

  return (
    <section className="bg-white p-6 rounded-xl shadow space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Stock del producto</h3>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Agregar código
        </button>
      </div>

      <ProductStockTable
        items={items}
        onDelete={handleDeleteStock}
      />

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button
            disabled={page === 0}
            onClick={() => loadStock(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="px-3 py-1 text-sm">
            Página {page + 1} de {totalPages}
          </span>

          <button
            disabled={page + 1 >= totalPages}
            onClick={() => loadStock(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}


      <BulkStockUpload productId={productId} onSuccess={loadStock} />

      {showAddModal && (
        <AddStockModal
          productId={productId}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadStock}
        />
      )}
    </section>
  );
}
