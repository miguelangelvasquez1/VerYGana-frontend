"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { editProduct, getProductEditInfo, getProductStock, getProductStockCode, deleteStockItem, addBulkStockItems } from "@/services/ProductService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { useProductImageUpdate } from "@/hooks/products/useProductImageUpdate";
import {
  ProductEditInfoResponseDTO,
  UpdateProductRequestDTO,
} from "@/types/products/Product.types";
import { ProductStockResponseDTO, ProductStockRequestDTO } from "@/types/products/ProductStock.types";
import { OptionalTargetAudienceDTO } from "@/types/TargetAudience.types";
import { PagedResponse } from "@/types/Generic.types";
import StockInputSection, { StockItemForm } from "./stock/StockInputSection";
import TargetAudienceFields, {
  isTargetAudienceValid,
} from "@/components/shared/targeting/TargetAudienceFields";
import toast from "react-hot-toast";
import { RefreshCw, ChevronLeft, ChevronRight, Trash2, Eye, EyeOff, Copy } from "lucide-react";

// ============================================================
// TIPOS LOCALES
// ============================================================

interface Category { id: number; name: string; }

interface Props {
  productId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type StockStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'INVALID';

const STATUS_LABELS: Record<StockStatus, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  EXPIRED: 'Expirado',
  INVALID: 'Inválido',
};

const STATUS_COLORS: Record<StockStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  SOLD: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  INVALID: 'bg-red-100 text-red-600',
};

const buildExpirationDate = (date: string, time: string): string | null => {
  if (!date) return null;
  return `${date}T${time || '00:00'}:00`;
};

// ============================================================
// COMPONENTE
// ============================================================

export default function EditProductForm({ productId, onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingData, setIsSavingData] = useState(false);

  const [form, setForm] = useState<ProductEditInfoResponseDTO>({
    id: 0,
    name: "",
    description: "",
    productCategoryId: 0,
    price: 0,
    imageUrl: "",
    totalStockItems: 0,
    availableStockItems: 0,
    targeting: null,
  });
  const [targeting, setTargeting] = useState<OptionalTargetAudienceDTO>({});

  // ── Imagen ─────────────────────────────────────────────────
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state: imageState, updateImage, reset: resetImage } = useProductImageUpdate();
  const isUploadingImage = ['preparing', 'uploading', 'confirming'].includes(imageState.status);
  const isAnythingLoading = isSavingData || isUploadingImage;

  // ── Tabla de códigos ───────────────────────────────────────
  const [pagedStock, setPagedStock] = useState<PagedResponse<ProductStockResponseDTO> | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockPage, setStockPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StockStatus | ''>('');
  const [soldDateFilter, setSoldDateFilter] = useState('');

  // ── Carga masiva ───────────────────────────────────────────
  const [newStockItems, setNewStockItems] = useState<StockItemForm[]>([]);
  const [isSavingStock, setIsSavingStock] = useState(false);

  // ── Revelar código de stock ──────────────────────────────────
  const [revealedCodes, setRevealedCodes] = useState<Record<number, string>>({});
  const [loadingCodeId, setLoadingCodeId] = useState<number | null>(null);

  // ============================================================
  // CARGA DE DATOS
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const [product, cats] = await Promise.all([
          getProductEditInfo(productId),
          getActiveProductCategories(),
        ]);
        setForm(product);
        setTargeting(product.targeting ?? {});
        setCategories(cats);
      } catch (err) {
        console.error('Error cargando datos del producto:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [productId]);

  const loadStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const result = await getProductStock(productId, {
        page: stockPage,
        size: 10,
        status: statusFilter || undefined,
        soldDate: soldDateFilter || undefined,
      });
      setPagedStock(result);
    } catch (err) {
      console.error('Error cargando stock:', err);
    } finally {
      setLoadingStock(false);
    }
  }, [productId, stockPage, statusFilter, soldDateFilter]);

  useEffect(() => {
    if (!loading) loadStock();
  }, [loading, loadStock]);

  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" || name === "productCategoryId" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImage(file);
    setNewImagePreview(URL.createObjectURL(file));
    resetImage();
  };

  const handleRemoveNewImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImage(null);
    setNewImagePreview(null);
    resetImage();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitData = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isTargetAudienceValid(targeting)) {
      toast.error('En Preferencia de audiencia: la edad máxima debe ser mayor o igual a la mínima');
      return;
    }
    const request: UpdateProductRequestDTO = {
      name: form.name,
      description: form.description,
      productCategoryId: form.productCategoryId,
      price: form.price,
      targeting,
    };
    try {
      setIsSavingData(true);
      await editProduct(productId, request);
      toast.success('Producto actualizado correctamente');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el producto');
    } finally {
      setIsSavingData(false);
    }
  };

  const handleImageUpdate = async () => {
    if (!newImage) return;
    const result = await updateImage(productId, newImage);
    if (result.ok) {
      toast.success('Imagen actualizada correctamente');
      handleRemoveNewImage();
      const updated = await getProductEditInfo(productId);
      setForm((prev) => ({ ...prev, imageUrl: updated.imageUrl }));
    } else {
      toast.error(`Error al actualizar imagen: ${result.errorMsg}`);
    }
  };

  const handleDeleteStockItem = async (stockId: number) => {
    if (!window.confirm('¿Eliminar este código de stock?')) return;
    try {
      await deleteStockItem(productId, stockId);
      toast.success('Código eliminado correctamente');
      loadStock();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar el código');
    }
  };

  const handleToggleCode = async (stockId: number) => {
    if (revealedCodes[stockId] != null) {
      setRevealedCodes((prev) => {
        const next = { ...prev };
        delete next[stockId];
        return next;
      });
      return;
    }
    try {
      setLoadingCodeId(stockId);
      const code = await getProductStockCode(productId, stockId);
      setRevealedCodes((prev) => ({ ...prev, [stockId]: code }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al obtener el código');
    } finally {
      setLoadingCodeId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  const handleSaveNewStock = async () => {
    if (newStockItems.length === 0) return toast.error('Agrega al menos un código');
    if (newStockItems.some((item) => !item.code.trim())) return toast.error('Todos los códigos deben tener un valor');

    const requests: ProductStockRequestDTO[] = newStockItems.map((item) => ({
      code: item.code,
      additionalInfo: item.additionalInfo.trim(),
      expirationDate: buildExpirationDate(item.expirationDate_date, item.expirationDate_time),
    }));

    try {
      setIsSavingStock(true);
      const result = await addBulkStockItems(productId, requests);
      toast.success(`${result.successfullyAdded} código(s) agregado(s) correctamente.`);
      if (result.failed > 0) toast.error(`${result.failed} código(s) fallaron.`);
      setNewStockItems([]);
      loadStock();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar los códigos');
    } finally {
      setIsSavingStock(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const imageStatusLabel: Record<string, string> = {
    preparing: 'Preparando...',
    uploading: `Subiendo... ${Math.round(imageState.progress)}%`,
    confirming: 'Confirmando...',
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const totalPages = pagedStock?.meta?.totalPages ?? 0;
  const stockItems = pagedStock?.data ?? [];

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) return <p className="text-center py-8 text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ══════════════════════════════════════════════════
          1. IMAGEN
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Imagen del producto</h3>

        {form.imageUrl && !newImagePreview && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Imagen actual</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={form.imageUrl}
                alt="Imagen actual del producto"
                className="w-full max-h-72 object-contain p-2"
              />
            </div>
          </div>
        )}

        {newImagePreview && (
          <div className="relative">
            <p className="text-xs text-gray-400 mb-1">Nueva imagen seleccionada</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={newImagePreview}
                alt="Nueva imagen"
                className="w-full max-h-72 object-contain p-2"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveNewImage}
              disabled={isUploadingImage}
              className="absolute top-7 right-2 bg-white text-red-600 border border-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
            >
              Quitar
            </button>
          </div>
        )}

        <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <span className="text-sm text-gray-500">
            {newImage ? newImage.name : 'Haz clic para cambiar la imagen'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={isUploadingImage}
          />
        </label>

        {isUploadingImage && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#03548C] h-2 rounded-full transition-all duration-300"
                style={{ width: `${imageState.progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">{imageStatusLabel[imageState.status]}</p>
          </div>
        )}

        {imageState.status === 'error' && (
          <p className="text-xs text-red-600">{imageState.error}</p>
        )}

        {newImage && (
          <button
            type="button"
            onClick={handleImageUpdate}
            disabled={isUploadingImage}
            className="w-full bg-[#03548C] text-white py-2 rounded-lg hover:bg-[#0b1440] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage ? imageStatusLabel[imageState.status] : 'Actualizar imagen'}
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          2. DATOS DEL PRODUCTO
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-xl shadow">
        <form onSubmit={handleSubmitData} className="space-y-4">
          <h3 className="text-base font-semibold text-gray-700">Datos del producto</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
              required
              disabled={isAnythingLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
              rows={4}
              required
              disabled={isAnythingLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio (COP) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                min={1}
                step="0.01"
                required
                disabled={isAnythingLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select
                name="productCategoryId"
                value={form.productCategoryId}
                onChange={handleChange}
                className="w-full border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                required
                disabled={isAnythingLoading}
              >
                <option value={0} disabled>Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <p>Total registrados: <strong>{form.totalStockItems}</strong></p>
            <p>Disponibles: <strong>{form.availableStockItems}</strong></p>
          </div>

          <TargetAudienceFields
            value={targeting}
            onChange={setTargeting}
            mode="preference"
            disabled={isAnythingLoading}
          />

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isAnythingLoading}
              className="flex-1 bg-linear-to-r from-[#b8860b] via-[#FFD700] to-[#c9a227] hover:brightness-110 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingData ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isAnythingLoading}
              className="flex-1 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════
          3. TABLA DE CÓDIGOS
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Códigos de stock</h3>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar por estado</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StockStatus | ''); setStockPage(0); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
            >
              <option value="">Todos los estados</option>
              {(Object.keys(STATUS_LABELS) as StockStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar por fecha de venta</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={soldDateFilter}
                onChange={(e) => { setSoldDateFilter(e.target.value); setStockPage(0); }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
              />
              <button
                type="button"
                onClick={() => { setStatusFilter(''); setSoldDateFilter(''); setStockPage(0); }}
                title="Limpiar filtros"
                className="px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-500 self-end"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3 w-32">Estado</th>
                <th className="px-4 py-3 w-32">Creado</th>
                <th className="px-4 py-3 w-32">Vendido</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingStock ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#03548C] border-t-transparent rounded-full animate-spin" />
                      Cargando códigos...
                    </div>
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No se encontraron códigos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                stockItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400 text-xs">{stockPage * 10 + index + 1}</td>
                    <td className="px-4 py-3">
                      {revealedCodes[item.id] != null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-800">{revealedCodes[item.id]}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(revealedCodes[item.id])}
                            title="Copiar código"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCode(item.id)}
                            title="Ocultar código"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleCode(item.id)}
                          disabled={loadingCodeId === item.id}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#03548C] hover:text-[#0b1440] disabled:opacity-40 transition"
                        >
                          {loadingCodeId === item.id ? (
                            <span className="w-3 h-3 border-2 border-[#03548C] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Ver código
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.soldAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteStockItem(item.id)}
                        title="Eliminar código"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              Página {stockPage + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStockPage((p) => p - 1)}
                disabled={stockPage === 0}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStockPage((p) => p + 1)}
                disabled={stockPage >= totalPages - 1}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          4. CARGA MASIVA DE CÓDIGOS
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Carga masiva de códigos</h3>
        <p className="text-xs text-gray-400">Agrega nuevos códigos de stock a este producto.</p>

        <StockInputSection
          value={newStockItems}
          onChange={setNewStockItems}
          disabled={isSavingStock}
        />

        {newStockItems.length > 0 && (
          <button
            type="button"
            onClick={handleSaveNewStock}
            disabled={isSavingStock}
            className="w-full bg-linear-to-r from-[#b8860b] via-[#FFD700] to-[#c9a227] hover:brightness-110 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingStock ? 'Guardando códigos...' : `Guardar ${newStockItems.length} código(s)`}
          </button>
        )}
      </div>

    </div>
  );
}
