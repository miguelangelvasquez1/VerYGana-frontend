"use client";

import { useEffect, useState } from "react";
import { editProduct, getProductEditInfo } from "@/services/ProductService";
import { getProductCategories } from "@/services/ProductCategoryService";
import {
  ProductEditInfoResponseDTO,
  UpdateProductRequestDTO,
} from "@/types/products/Product.types";

interface Props {
  productId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditProductForm({
  productId,
  onSuccess,
  onCancel,
}: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState<ProductEditInfoResponseDTO>({
    id: 0,
    name: "",
    description: "",
    productCategoryId: 0,
    price: 0,
    deliveryType: "AUTO",
    digitalFormat: "CODE",
    imageUrl: "",
    totalStockItems: 0,
    availableStockItems: 0,
  });

  useEffect(() => {
    setLoading(true);

    const loadData = async () => {
      try {
        const [product, cats] = await Promise.all([
          getProductEditInfo(productId),
          getProductCategories(),
        ]);

        setForm(product);
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "productCategoryId"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateRequest: UpdateProductRequestDTO = {
      name: form.name,
      description: form.description,
      productCategoryId: form.productCategoryId,
      price: form.price,
      deliveryType: form.deliveryType,
      digitalFormat: form.digitalFormat,
    };

    await editProduct(productId, updateRequest, imageFile ?? undefined);

    alert("Producto actualizado correctamente");
    onSuccess();
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-4"
    >
      <h2 className="text-2xl font-bold text-center">Editar producto</h2>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
        placeholder="Nombre"
        required
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
        required
      />

      <input
        type="number"
        name="price"
        value={form.price}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
        min={0}
        step="0.01"
        required
      />

      <select
        name="productCategoryId"
        value={form.productCategoryId}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
        required
      >
        <option value={0} disabled>
          Selecciona una categoría
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Delivery Type */}
      <select
        name="deliveryType"
        value={form.deliveryType}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
      >
        <option value="AUTO">Automático</option>
        <option value="MANUAL">Manual</option>
        <option value="EXTERNAL_API">API Externa</option>
      </select>

      {/* Digital Format */}
      <select
        name="digitalFormat"
        value={form.digitalFormat}
        onChange={handleChange}
        className="w-full border p-2 rounded-lg"
      >
        <option value="CODE">Código</option>
        <option value="LINK">Link</option>
        <option value="FILE">Archivo</option>
      </select>

      {/* Imagen */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />

      {/* Info de stock (solo lectura) */}
      <div className="text-sm text-gray-600">
        <p>Total de códigos: {form.totalStockItems}</p>
        <p>Disponibles: {form.availableStockItems}</p>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg">
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border py-3 rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
