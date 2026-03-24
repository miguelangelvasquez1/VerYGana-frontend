"use client";

import { useEffect, useState } from "react";
import { createProduct } from "@/services/ProductService";
import { getProductCategories } from "@/services/ProductCategoryService";

export default function CreateProductForm() {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    productCategoryId: "",
    price: "",
    deliveryType: "AUTO" as "AUTO" | "MANUAL" | "EXTERNAL_API",
    digitalFormat: "CODE" as "LINK" | "FILE" | "CODE",
    stockItems: [
      {
        code: "",
        additionalInfo: "",
        expirationDate_date: "",
        expirationDate_time: "",
      },
    ],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories(await getProductCategories());
      } catch (err) {
        console.error("Error cargando categorías", err);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  type StockField =
    | "code"
    | "additionalInfo"
    | "expirationDate_date"
    | "expirationDate_time";

  const handleStockChange = (index: number, field: StockField, value: string) => {
    const updated = [...form.stockItems];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, stockItems: updated }));
  };

  const addStockItem = () => {
    setForm((prev) => ({
      ...prev,
      stockItems: [
        ...prev.stockItems,
        {
          code: "",
          additionalInfo: "",
          expirationDate_date: "",
          expirationDate_time: "",
        },
      ],
    }));
  };

  const removeStockItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      stockItems: prev.stockItems.filter((_, i) => i !== index),
    }));
  };

  /** Combinar fecha + hora en LocalDateTime */
  const buildExpirationDate = (date: string, time: string): string | null => {
    if (!date) return null;
    if (!time) return `${date}T00:00:00`;
    return `${date}T${time}:00`;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!productImage) return alert("Selecciona una imagen");
    if (!form.productCategoryId)
      return alert("Debes seleccionar una categoría");

    const priceValue = parseFloat(form.price);
    if (!priceValue || priceValue <= 0)
      return alert("El precio debe ser mayor a 0");

    const mappedStock = form.stockItems.map((item) => ({
      code: item.code,
      additionalInfo: item.additionalInfo?.trim() || "",
      expirationDate: buildExpirationDate(
        item.expirationDate_date,
        item.expirationDate_time
      ),
    }));

    const dto = {
      name: form.name,
      description: form.description,
      productCategoryId: parseInt(form.productCategoryId),
      price: priceValue,
      deliveryType: form.deliveryType,
      digitalFormat: form.digitalFormat,
      stockItems: mappedStock,
    };

    try {
      await createProduct(dto, productImage);
      alert("Producto creado con éxito");
    } catch (err) {
      console.error(err);
      alert("Error al crear producto");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-8"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Crear nuevo producto
      </h2>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Imagen del producto
        </label>

        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <p className="text-sm text-gray-600">
            Haz clic para subir una imagen
          </p>

          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => setProductImage(e.target.files?.[0] || null)}
          />
        </label>

        {productImage && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Archivo seleccionado: <strong>{productImage.name}</strong>
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm">Nombre *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm">Precio (COP) *</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
            min="1"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm">Categoría *</label>
          <select
            name="productCategoryId"
            value={form.productCategoryId}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de entrega */}
        <div>
          <label className="block text-sm">Tipo de entrega</label>
          <div className="flex gap-4 mt-1">
            {["AUTO", "MANUAL", "EXTERNAL_API"].map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryType"
                  value={t}
                  checked={form.deliveryType === t}
                  onChange={handleChange}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm">Descripción *</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded-lg"
          rows={4}
          required
        />
      </div>

      {/* Formato digital */}
      <div>
        <label className="block text-sm">Formato digital</label>
        <select
          name="digitalFormat"
          value={form.digitalFormat}
          onChange={handleChange}
          className="w-full border p-2 rounded-lg"
        >
          <option value="LINK">Enlace</option>
          <option value="FILE">Archivo</option>
          <option value="CODE">Código</option>
        </select>
      </div>

      {/* Stock */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Stock digital</h3>
          <button
            type="button"
            onClick={addStockItem}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg"
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
              <label className="block text-sm">Código *</label>
              <input
                value={item.code}
                onChange={(e) =>
                  handleStockChange(index, "code", e.target.value)
                }
                className="w-full border p-2 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm">Info adicional</label>
              <input
                value={item.additionalInfo}
                onChange={(e) =>
                  handleStockChange(index, "additionalInfo", e.target.value)
                }
                className="w-full border p-2 rounded-lg"
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm">Fecha de expiración</label>
              <input
                type="date"
                value={item.expirationDate_date}
                onChange={(e) =>
                  handleStockChange(index, "expirationDate_date", e.target.value)
                }
                className="w-full border p-2 rounded-lg"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm">Hora</label>
              <input
                type="time"
                value={item.expirationDate_time}
                onChange={(e) =>
                  handleStockChange(index, "expirationDate_time", e.target.value)
                }
                className="w-full border p-2 rounded-lg"
              />
            </div>

            <div className="md:col-span-4 text-right">
              <button
                type="button"
                onClick={() => removeStockItem(index)}
                className="text-red-600 text-sm hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white p-3 rounded-xl text-lg hover:bg-green-700 transition"
      >
        Crear producto
      </button>
    </form>
  );
}
