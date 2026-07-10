"use client";

import { useEffect, useRef, useState } from "react";
import { useProductCreation } from "@/hooks/products/useProductCreation";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { CreateProductRequestDTO } from "@/types/products/Product.types";
import { ProductStockRequestDTO } from "@/types/products/ProductStock.types";
import StockInputSection, { StockItemForm } from "./stock/StockInputSection";
import toast from "react-hot-toast";

// ============================================================
// TIPOS LOCALES
// ============================================================

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

const initialForm: ProductFormState = {
  name: '',
  description: '',
  productCategoryId: '',
  price: '',
  stockItems: [],
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

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!image) return toast.error('Selecciona una imagen');
    if (!form.productCategoryId) return toast.error('Debes seleccionar una categoría');

    const price = parseFloat(form.price);
    if (!price || price <= 0) return toast.error('El precio debe ser mayor a 0');

    if (form.stockItems.length === 0) return toast.error('Debes agregar al menos un código de stock');
    if (form.stockItems.some((item) => !item.code.trim())) return toast.error('Todos los códigos deben tener un valor');

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
      toast.success(
        "Solicitud enviada con éxito. La revisaremos pronto."
      );
      setForm(initialForm);
      setImage(null);
      setImagePreview(null);
      reset();
    } else {
      toast.error(result.errorMsg ?? 'No se pudo crear el producto');
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
              className="w-full max-h-72 object-contain rounded-xl p-2"
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
      <StockInputSection
        value={form.stockItems}
        onChange={(items) => setForm((prev) => ({ ...prev, stockItems: items }))}
        disabled={isSubmitting}
      />

      {/* ── Barra de progreso ── */}
      {isSubmitting && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#03548C] h-2 rounded-full transition-all duration-300"
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
        className="w-full bg-[#03548C] text-white p-3 rounded-xl text-lg hover:bg-[#0b1440] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? statusLabel[state.status] : 'Crear producto'}
      </button>
    </form>
  );
}