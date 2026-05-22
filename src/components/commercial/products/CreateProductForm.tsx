"use client";

import { useEffect, useRef, useState } from "react";
import { useProductCreation } from "@/hooks/products/useProductCreation";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { CreateProductRequestDTO } from "@/types/products/Product.types";
import { ProductStockRequestDTO } from "@/types/products/ProductStock.types";

// ============================================================
// TIPOS LOCALES
// ============================================================

interface StockItemForm {
  code: string;
  additionalInfo: string;
  expirationDate_date: string;
  expirationDate_time: string;
}

interface ProductFormState {
  name: string;
  description: string;
  productCategoryId: string;
  price: string;
  stockItems: StockItemForm[];
}

interface Category {
  id: number;
  name: string;
}

// ============================================================
// HELPERS
// ============================================================

const buildExpirationDate = (date: string, time: string): string | null => {
  if (!date) return null;
  return `${date}T${time || '00:00'}:00`;
};

const emptyStockItem = (): StockItemForm => ({
  code: '',
  additionalInfo: '',
  expirationDate_date: '',
  expirationDate_time: '',
});

const initialForm: ProductFormState = {
  name: '',
  description: '',
  productCategoryId: '',
  price: '',
  stockItems: [emptyStockItem()],
};

// ============================================================
// COMPONENTE
// ============================================================

export default function CreateProductForm() {
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state, createProduct, reset } = useProductCreation();

  const isSubmitting = ['preparing', 'uploading', 'creating'].includes(state.status);

  // ── Cargar categorías ──────────────────────────────────────
  useEffect(() => {
    getActiveProductCategories()
      .then(setCategories)
      .catch((err) => console.error('Error cargando categorías:', err));
  }, []);

  // ── Limpiar URL de preview al desmontar ────────────────────
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ── Handlers del formulario ────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleStockChange = (
    index: number,
    field: keyof StockItemForm,
    value: string
  ) => {
    setForm((prev) => {
      const updated = [...prev.stockItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stockItems: updated };
    });
  };

  const addStockItem = () => {
    setForm((prev) => ({
      ...prev,
      stockItems: [...prev.stockItems, emptyStockItem()],
    }));
  };

  const removeStockItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      stockItems: prev.stockItems.filter((_, i) => i !== index),
    }));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) return alert('Selecciona una imagen');
    if (!form.productCategoryId) return alert('Debes seleccionar una categoría');

    const price = parseFloat(form.price);
    if (!price || price <= 0) return alert('El precio debe ser mayor a 0');

    const stockItems: ProductStockRequestDTO[] = form.stockItems.map((item) => ({
      code: item.code,
      additionalInfo: item.additionalInfo.trim(),
      expirationDate: buildExpirationDate(item.expirationDate_date, item.expirationDate_time),
    }));

    const productData: CreateProductRequestDTO = {
      name: form.name,
      description: form.description,
      productCategoryId: parseInt(form.productCategoryId),
      price,
      stockItems,
    };

    const result = await createProduct(image, productData);

    if (result.ok) {
      alert(`Solicitud de creacion de producto enviada con éxito (ID: ${result.productId})`);
      setForm(initialForm);
      setImage(null);
      setImagePreview(null);
      reset();
    } else {
      alert(`Error: ${result.errorMsg}`);
    }
  };

  // ── Label del estado de subida ─────────────────────────────
  const statusLabel: Record<string, string> = {
    preparing: 'Preparando...',
    uploading: `Subiendo imagen... ${Math.round(state.progress)}%`,
    creating: 'Creando producto...',
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-8"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Crear nuevo producto
      </h2>

      {/* ── Imagen ── */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Imagen del producto *
        </label>

        <label
          className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
          style={{ minHeight: '10rem' }}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <p className="text-sm text-gray-500 py-10">
              Haz clic para subir una imagen
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </label>

        {image && (
          <p className="mt-2 text-sm text-gray-500 text-center">
            {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* ── Datos principales ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
            disabled={isSubmitting}
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
            required
            min="1"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Descripción ── */}
      <div>
        <label className="block text-sm font-medium mb-1">Descripción *</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded-lg"
          rows={4}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* ── Stock ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Códigos de stock</h3>
          <button
            type="button"
            onClick={addStockItem}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
          >
            + Agregar código
          </button>
        </div>

        {form.stockItems.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                value={item.code}
                onChange={(e) => handleStockChange(index, 'code', e.target.value)}
                className="w-full border p-2 rounded-lg"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Info adicional</label>
              <input
                value={item.additionalInfo}
                onChange={(e) => handleStockChange(index, 'additionalInfo', e.target.value)}
                className="w-full border p-2 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha de expiración</label>
              <input
                type="date"
                value={item.expirationDate_date}
                onChange={(e) => handleStockChange(index, 'expirationDate_date', e.target.value)}
                className="w-full border p-2 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hora</label>
              <input
                type="time"
                value={item.expirationDate_time}
                onChange={(e) => handleStockChange(index, 'expirationDate_time', e.target.value)}
                className="w-full border p-2 rounded-lg"
                disabled={isSubmitting}
              />
            </div>

            <div className="md:col-span-4 text-right">
              <button
                type="button"
                onClick={() => removeStockItem(index)}
                disabled={isSubmitting || form.stockItems.length === 1}
                className="text-red-600 text-sm hover:underline disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de progreso ── */}
      {isSubmitting && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-gray-600">
            {statusLabel[state.status]}
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {state.status === 'error' && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white p-3 rounded-xl text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? statusLabel[state.status] : 'Crear producto'}
      </button>
    </form>
  );
}