import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, DollarSign, Package, Image, AlertCircle } from 'lucide-react';
import * as productService from '@/services/ProductService';
import { getProductCategories } from '@/services/ProductCategoryService';

export default function CreateProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    imagesUrls: [''],
    stock: '',
    price: ''
  });

  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar categorías
  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const cats = await getProductCategories();
        if (mounted) {
          setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };
    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Manejar inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImages = [...formData.imagesUrls];
    newImages[index] = value;

    setFormData(prev => ({ ...prev, imagesUrls: newImages }));
    if (errors.imagesUrls) setErrors(prev => ({ ...prev, imagesUrls: '' }));
  };

  const addImageUrl = () => {
    if (formData.imagesUrls.length < 5) {
      setFormData(prev => ({
        ...prev,
        imagesUrls: [...prev.imagesUrls, '']
      }));
    }
  };

  const removeImageUrl = (index: number) => {
    if (formData.imagesUrls.length > 1) {
      const newImages = formData.imagesUrls.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, imagesUrls: newImages }));
    }
  };

  // Validación
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre del producto es requerido';
    else if (formData.name.trim().length > 100) newErrors.name = 'El nombre no puede exceder 100 caracteres';

    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    else if (formData.description.trim().length < 10)
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';

    if (!formData.categoryId) newErrors.categoryId = 'Debes seleccionar una categoría';

    const validUrls = formData.imagesUrls.map(u => u.trim()).filter(u => u);
    if (validUrls.length === 0) newErrors.imagesUrls = 'Debes agregar al menos una imagen';
    else {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
      const badUrls = validUrls.filter(url => !urlPattern.test(url));
      if (badUrls.length > 0)
        newErrors.imagesUrls = 'Todas las URLs deben ser válidas (http/https y terminar en jpg, png, gif o webp)';
    }

    const stockNum = Number(formData.stock);
    if (formData.stock === '') newErrors.stock = 'El stock es requerido';
    else if (!Number.isFinite(stockNum) || !Number.isInteger(stockNum) || stockNum < 1)
      newErrors.stock = 'El stock debe ser un número entero mayor o igual a 1';

    const priceNum = Number(formData.price);
    if (formData.price === '') newErrors.price = 'El precio es requerido';
    else if (!Number.isFinite(priceNum) || priceNum < 0)
      newErrors.price = 'El precio debe ser un número mayor o igual a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      const cleanedUrls = formData.imagesUrls.map(u => u.trim()).filter(u => u);

      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: Number(formData.categoryId),
        imagesUrls: cleanedUrls,
        stock: Number(formData.stock),
        price: Number(formData.price)
      };

      await productService.createProduct(dataToSend);

      setSuccessMessage('¡Producto creado exitosamente! 🎉');

      setFormData({
        name: '',
        description: '',
        categoryId: '',
        imagesUrls: [''],
        stock: '',
        price: ''
      });

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Ocurrió un error al crear el producto.';
      setErrors(prev => ({ ...prev, submit: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Publicar Nuevo Producto</h1>
          <p className="text-gray-600">Completa la información para que tu producto sea visible</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              ✔
            </div>
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

          {/* NOMBRE */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Producto *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
              placeholder="Ej: iPhone 13 Pro Max"
            />
            {errors.name && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" /> <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
            />
            {errors.description && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" /> <span>{errors.description}</span>
              </div>
            )}
          </div>

          {/* CATEGORÍA */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${errors.categoryId ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" /> <span>{errors.categoryId}</span>
              </div>
            )}
          </div>

          {/* IMÁGENES */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imágenes del Producto *
            </label>

            <div className="space-y-3">
              {formData.imagesUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => handleImageUrlChange(index, e.target.value)}
                    className={`flex-1 px-4 py-3 border ${errors.imagesUrls ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                    placeholder={`URL de imagen ${index + 1}`}
                  />

                  {formData.imagesUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="px-3 py-3 bg-red-50 text-red-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formData.imagesUrls.length < 5 && (
              <button
                type="button"
                onClick={addImageUrl}
                className="mt-2 flex gap-2 text-blue-600"
              >
                <Plus className="w-4 h-4" /> Agregar otra imagen
              </button>
            )}

            {errors.imagesUrls && (
              <p className="mt-2 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.imagesUrls}
              </p>
            )}
          </div>

          {/* STOCK Y PRECIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.stock ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
              />
              {errors.stock && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Precio (COP) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.price ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
              />
              {errors.price && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* ERROR GENERAL */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '',
                  description: '',
                  categoryId: '',
                  imagesUrls: [''],
                  stock: '',
                  price: ''
                });
                setErrors({});
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publicar Producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
