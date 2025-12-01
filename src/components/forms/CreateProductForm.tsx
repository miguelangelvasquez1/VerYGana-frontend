import { useEffect, useState } from "react";
import { createProduct } from "@/services/ProductService";
import { getProductCategories } from "@/services/ProductCategoryService";

export default function CreateProductForm() {
  const [productImage, setProductImage] = useState<File | null>(null);

  const [categories, setCategories] = useState<any[]>([]); // ← Lista de categorías

  const [form, setForm] = useState({
    name: "",
    description: "",
    productCategoryId: "",
    price: "",
    deliveryType: "AUTO",
    digitalFormat: "CODE",
    stockItems: [
      { code: "", additionalInfo: "", expirationDate: "" }
    ]
  });

  // ==========================
  // Cargar categorías al iniciar
  // ==========================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProductCategories();
        setCategories(response);
        console.log("Categorías cargadas", response);
      } catch (error) {
        console.error("Error cargando categorías", error);
      }
    };

    loadCategories();
  }, []);

  // ==========================
  // Handlers del formulario
  // ==========================

  const handleChange = (e: any) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  type StockField = "code" | "additionalInfo" | "expirationDate";

  const handleStockChange = (index: number, field: StockField, value: string) => {
    const updated = [...form.stockItems];
    updated[index][field] = value;
    setForm(prev => ({ ...prev, stockItems: updated }));
  };

  const addStockItem = () => {
    setForm(prev => ({
      ...prev,
      stockItems: [...prev.stockItems, { code: "", additionalInfo: "", expirationDate: "" }]
    }));
  };

  const handleImageChange = (e: any) => {
    if (e.target.files.length > 0) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!productImage) {
      alert("Selecciona una imagen");
      return;
    }

    const dto = {
      ...form,
      price: parseFloat(form.price),
      productCategoryId: parseInt(form.productCategoryId),
    };

    try {
      const response = await createProduct(dto, productImage);
      console.log(response);
      alert("Producto creado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error creando producto");
    }
  };

  // ==========================
  // RENDER DEL FORMULARIO
  // ==========================

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold">Crear Producto</h2>

      <input name="name" placeholder="Nombre" onChange={handleChange} className="w-full border p-2" />

      <textarea name="description" placeholder="Descripción" onChange={handleChange} className="w-full border p-2" />

      {/* ======================= */}
      {/* SELECT CATEGORÍAS       */}
      {/* ======================= */}
      <select
        name="productCategoryId"
        onChange={handleChange}
        className="w-full border p-2"
      >
        <option value="">Seleccione una categoría</option>

        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <input name="price" type="number" placeholder="Precio" onChange={handleChange} className="w-full border p-2" />

      <select name="deliveryType" onChange={handleChange} className="w-full border p-2">
        <option value="AUTO">AUTO</option>
        <option value="MANUAL">MANUAL</option>
      </select>

      <select name="digitalFormat" onChange={handleChange} className="w-full border p-2">
        <option value="CODE">CODE</option>
        <option value="ACCOUNT">ACCOUNT</option>
      </select>

      <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border p-2" />

      <h3 className="font-semibold mt-4">Stock Items</h3>

      {form.stockItems.map((item, i) => (
        <div key={i} className="border p-3 space-y-2">
          <input
            placeholder="Código"
            value={item.code}
            onChange={(e) => handleStockChange(i, "code", e.target.value)}
            className="w-full border p-2"
          />

          <input
            placeholder="Información adicional"
            value={item.additionalInfo}
            onChange={(e) => handleStockChange(i, "additionalInfo", e.target.value)}
            className="w-full border p-2"
          />

          <input
            type="datetime-local"
            value={item.expirationDate}
            onChange={(e) => handleStockChange(i, "expirationDate", e.target.value)}
            className="w-full border p-2"
          />
        </div>
      ))}

      <button type="button" onClick={addStockItem} className="bg-blue-500 text-white px-3 py-1 rounded">
        + Agregar Stock
      </button>

      <button type="submit" className="bg-green-600 text-white p-2 rounded w-full">
        Crear Producto
      </button>
    </form>
  );
}
