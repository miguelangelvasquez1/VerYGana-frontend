"use client";

import { useEffect, useRef, useState } from "react";
import { editProduct, getProductEditInfo } from "@/services/ProductService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { useProductImageUpdate } from "@/hooks/products/useProductImageUpdate";
import {
  ProductEditInfoResponseDTO,
  UpdateProductRequestDTO,
} from "@/types/products/Product.types";

// ============================================================
// TIPOS LOCALES
// ============================================================

interface Category {
  id: number;
  name: string;
}

interface Props {
  productId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

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
  });

  // Estado de la imagen nueva seleccionada localmente
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: imageState, updateImage, reset: resetImage } = useProductImageUpdate();

  const isUploadingImage = ['preparing', 'uploading', 'confirming'].includes(imageState.status);
  const isAnythingLoading = isSavingData || isUploadingImage;

  // ── Cargar datos del producto y categorías ─────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [product, cats] = await Promise.all([
          getProductEditInfo(productId),
          getActiveProductCategories(),
        ]);
        setForm(product);
        setCategories(cats);
      } catch (err) {
        console.error('Error cargando datos del producto:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // ── Limpiar URL de preview al desmontar ────────────────────
  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  // ── Handlers ───────────────────────────────────────────────
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

  // ── Guardar datos del producto (sin imagen) ────────────────
  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: UpdateProductRequestDTO = {
      name: form.name,
      description: form.description,
      productCategoryId: form.productCategoryId,
      price: form.price,
    };

    try {
      setIsSavingData(true);
      await editProduct(productId, request);
      alert('Producto actualizado correctamente');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al actualizar el producto';
      alert(`Error: ${msg}`);
    } finally {
      setIsSavingData(false);
    }
  };

  // ── Actualizar imagen ──────────────────────────────────────
  const handleImageUpdate = async () => {
    if (!newImage) return;

    const result = await updateImage(productId, newImage);

    if (result.ok) {
      alert('Imagen actualizada correctamente');
      handleRemoveNewImage();
      // Refrescar la imageUrl del formulario para mostrar la nueva imagen actual
      const updated = await getProductEditInfo(productId);
      setForm((prev) => ({ ...prev, imageUrl: updated.imageUrl }));
    } else {
      alert(`Error al actualizar imagen: ${result.errorMsg}`);
    }
  };

  // ── Labels del estado de imagen ───────────────────────────
  const imageStatusLabel: Record<string, string> = {
    preparing: 'Preparando...',
    uploading: `Subiendo... ${Math.round(imageState.progress)}%`,
    confirming: 'Confirmando...',
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) return <p className="text-center py-8 text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-8">
      <h2 className="text-2xl font-bold text-center">Editar producto</h2>

      {/* ── Sección imagen ── */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-700">Imagen del producto</h3>

        {/* Imagen actual */}
        {form.imageUrl && !newImagePreview && (
          <div className="relative">
            <p className="text-xs text-gray-400 mb-1">Imagen actual</p>
            <img
              src={form.imageUrl}
              alt="Imagen actual del producto"
              className="w-full h-48 object-cover rounded-xl border"
            />
          </div>
        )}

        {/* Preview nueva imagen */}
        {newImagePreview && (
          <div className="relative">
            <p className="text-xs text-gray-400 mb-1">Nueva imagen seleccionada</p>
            <img
              src={newImagePreview}
              alt="Nueva imagen"
              className="w-full h-48 object-cover rounded-xl border"
            />
            <button
              type="button"
              onClick={handleRemoveNewImage}
              disabled={isUploadingImage}
              className="absolute top-6 right-2 bg-white text-red-600 border border-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
            >
              Quitar
            </button>
          </div>
        )}

        {/* Selector de archivo */}
        <label className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
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

        {/* Barra de progreso de imagen */}
        {isUploadingImage && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${imageState.progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              {imageStatusLabel[imageState.status]}
            </p>
          </div>
        )}

        {imageState.status === 'error' && (
          <p className="text-xs text-red-600">{imageState.error}</p>
        )}

        {/* Botón actualizar imagen — solo visible si hay nueva imagen seleccionada */}
        {newImage && (
          <button
            type="button"
            onClick={handleImageUpdate}
            disabled={isUploadingImage}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage
              ? imageStatusLabel[imageState.status]
              : 'Actualizar imagen'}
          </button>
        )}
      </section>

      {/* ── Formulario de datos ── */}
      <form onSubmit={handleSubmitData} className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Datos del producto</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
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
            className="w-full border p-2 rounded-lg"
            rows={4}
            required
            disabled={isAnythingLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Precio (COP) *</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
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
            className="w-full border p-2 rounded-lg"
            required
            disabled={isAnythingLoading}
          >
            <option value={0} disabled>Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Info de stock — solo lectura */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
          <p>Total de códigos registrados: <strong>{form.totalStockItems}</strong></p>
          <p>Códigos disponibles: <strong>{form.availableStockItems}</strong></p>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isAnythingLoading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingData ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isAnythingLoading}
            className="flex-1 border py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}