// components/forms/CreateAdForm.tsx
'use client';

import React, { useState } from 'react';
import { Upload, X, DollarSign, Heart, Calculator, Calendar, MapPin, Tag, Link as LinkIcon } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { useCreateAd } from '@/hooks/useCreateAd';

interface CreateAdFormData {
  title: string;
  description: string;
  type: 'image' | 'video';
  file: File | null;
  rewardPerLike: number;
  maxLikes: number;
  totalBudget: number;
  categoryIds: number[];
  startImmediately: boolean;
  startDate: string;
  endWhenBudgetExhausted: boolean;
  endDate: string;
  targetUrl: string;
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    selectedDepartments: string[];
    municipalityCodes: string[];
  };
}

export function CreateAdForm() {
  const [formData, setFormData] = useState<CreateAdFormData>({
    title: '',
    description: '',
    type: 'image',
    file: null,
    rewardPerLike: 0.50,
    maxLikes: 100,
    totalBudget: 50.00,
    categoryIds: [],
    startImmediately: true,
    startDate: '',
    endWhenBudgetExhausted: true,
    endDate: '',
    targetUrl: '',
    targetAudience: {
      ageRange: [18, 65],
      gender: 'all',
      selectedDepartments: [],
      municipalityCodes: []
    }
  });

  const [dragActive, setDragActive] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Custom hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);
  const { createAd, loading: submitting, error: submitError } = useCreateAd();

  // Cálculo de presupuesto
  const calculateBudget = (reward: number, maxLikes: number) => {
    return (reward * maxLikes).toFixed(2);
  };

  const handleRewardChange = (value: number) => {
    const newBudget = Number(calculateBudget(value, formData.maxLikes));
    setFormData(prev => ({
      ...prev,
      rewardPerLike: value,
      totalBudget: newBudget
    }));
  };

  const handleMaxLikesChange = (value: number) => {
    const newBudget = Number(calculateBudget(formData.rewardPerLike, value));
    setFormData(prev => ({
      ...prev,
      maxLikes: value,
      totalBudget: newBudget
    }));
  };

  // Manejo de archivo
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData(prev => ({ ...prev, file: e.dataTransfer.files[0] }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // Manejo de categorías
  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  // Manejo de ubicaciones
  const addMunicipality = (municipalityCode: string) => {
    if (!formData.targetAudience.municipalityCodes.includes(municipalityCode)) {
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          municipalityCodes: [...prev.targetAudience.municipalityCodes, municipalityCode]
        }
      }));
    }
  };

  const removeMunicipality = (municipalityCode: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        municipalityCodes: prev.targetAudience.municipalityCodes.filter(m => m !== municipalityCode)
      }
    }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.file) {
      alert('Debes subir un archivo');
      return;
    }

    if (formData.categoryIds.length === 0) {
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    if (!formData.startImmediately && !formData.startDate) {
      alert('Debes seleccionar una fecha de inicio');
      return;
    }

    if (!formData.endWhenBudgetExhausted && !formData.endDate) {
      alert('Debes seleccionar una fecha de finalización');
      return;
    }

    // Preparar FormData
    const formDataToSend = new FormData();
    
    // Agregar datos del anuncio
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('rewardPerLike', formData.rewardPerLike.toString());
    formDataToSend.append('maxLikes', formData.maxLikes.toString());
    formDataToSend.append('mediaType', formData.type);
    
    if (formData.targetUrl) {
      formDataToSend.append('targetUrl', formData.targetUrl);
    }
    
    // Agregar fechas si no son inmediatas/automáticas
    if (!formData.startImmediately && formData.startDate) {
      formDataToSend.append('startDate', new Date(formData.startDate).toISOString());
    }
    
    if (!formData.endWhenBudgetExhausted && formData.endDate) {
      formDataToSend.append('endDate', new Date(formData.endDate).toISOString());
    }
    
    // Agregar archivo
    formDataToSend.append('file', formData.file);
    
    // Agregar categorías
    formData.categoryIds.forEach(id => {
      formDataToSend.append('categoryIds', id.toString());
    });
    
    // Agregar municipios
    formData.targetAudience.municipalityCodes.forEach(code => {
      formDataToSend.append('targetMunicipalitiesCodes', code);
    });
    
    // Agregar targeting demográfico
    formDataToSend.append('minAge', formData.targetAudience.ageRange[0].toString());
    formDataToSend.append('maxAge', formData.targetAudience.ageRange[1].toString());
    formDataToSend.append('targetGender', formData.targetAudience.gender.toUpperCase());

    try {
      await createAd(formDataToSend);
    } catch (error) {
      console.error('Error al crear anuncio:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Anuncio</h2>
      
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título del Anuncio
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa el título de tu anuncio"
            required
            minLength={5}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe tu anuncio..."
            required
            minLength={10}
            maxLength={1000}
          />
        </div>

        {/* URL de destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <LinkIcon className="w-4 h-4 mr-1" />
              URL de Destino (Opcional)
            </div>
          </label>
          <input
            type="url"
            value={formData.targetUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://ejemplo.com/tu-pagina"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Link al que se redirigirá cuando los usuarios hagan clic en tu anuncio
          </p>
        </div>

        {/* Presupuesto y Recompensas */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <Calculator className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Presupuesto y Recompensas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Recompensa por Like ($)
                </div>
              </label>
              <input
                type="number"
                value={formData.rewardPerLike}
                onChange={(e) => handleRewardChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.01"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo: $0.01 - Máximo: $100.00</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  Máximo de Likes
                </div>
              </label>
              <input
                type="number"
                value={formData.maxLikes}
                onChange={(e) => handleMaxLikesChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10000"
                step="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo: 1 - Máximo: 10,000</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Presupuesto Total Calculado</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${formData.rewardPerLike.toFixed(2)} × {formData.maxLikes} likes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  ${formData.totalBudget.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fechas de Campaña */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Duración de la Campaña</h3>
          </div>

          <div className="space-y-4">
            {/* Fecha de inicio */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="startImmediately"
                  checked={formData.startImmediately}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    startImmediately: e.target.checked,
                    startDate: e.target.checked ? '' : prev.startDate
                  }))}
                  className="mr-2"
                />
                <label htmlFor="startImmediately" className="text-sm font-medium text-gray-700">
                  Iniciar cuando el admin apruebe el anuncio
                </label>
              </div>

              {!formData.startImmediately && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            {/* Fecha de fin */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="endWhenBudgetExhausted"
                  checked={formData.endWhenBudgetExhausted}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endWhenBudgetExhausted: e.target.checked,
                    endDate: e.target.checked ? '' : prev.endDate
                  }))}
                  className="mr-2"
                />
                <label htmlFor="endWhenBudgetExhausted" className="text-sm font-medium text-gray-700">
                  Finalizar cuando se agote el presupuesto
                </label>
              </div>

              {!formData.endWhenBudgetExhausted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Finalización
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min={formData.startDate || new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tipo y archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Anuncio
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="image"
                checked={formData.type === 'image'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'image', file: null }))}
                className="mr-2"
              />
              Imagen
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="video"
                checked={formData.type === 'video'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'video', file: null }))}
                className="mr-2"
              />
              Video
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subir {formData.type === 'image' ? 'Imagen' : 'Video'}
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {formData.file ? (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-600">{formData.file.name}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Arrastra tu archivo aquí o{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    selecciona uno
                    <input
                      type="file"
                      className="hidden"
                      accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleFileChange}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'image' ? 'Máx 5MB - JPG, PNG, WebP' : 'Máx 100MB - MP4, WebM'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categorías (Intereses) */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Tag className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Categorías / Intereses</h3>
          </div>

          {loadingCategories ? (
            <p className="text-sm text-gray-500">Cargando categorías...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.categoryIds.includes(category.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </label>
              ))}
            </div>
          )}
          
          {formData.categoryIds.length === 0 && (
            <p className="text-sm text-red-500 mt-2">Debes seleccionar al menos una categoría</p>
          )}
        </div>

        {/* Audiencia objetivo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audiencia Objetivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Edad
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={formData.targetAudience.ageRange[0]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    targetAudience: {
                      ...prev.targetAudience,
                      ageRange: [Number(e.target.value), prev.targetAudience.ageRange[1]]
                    }
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="13"
                  max="100"
                />
                <span>a</span>
                <input
                  type="number"
                  value={formData.targetAudience.ageRange[1]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    targetAudience: {
                      ...prev.targetAudience,
                      ageRange: [prev.targetAudience.ageRange[0], Number(e.target.value)]
                    }
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="13"
                  max="100"
                />
                <span>años</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                value={formData.targetAudience.gender}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  targetAudience: {
                    ...prev.targetAudience,
                    gender: e.target.value as 'all' | 'male' | 'female'
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>

          {/* Ubicaciones */}
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-green-600 mr-2" />
              <label className="block text-sm font-medium text-gray-700">
                Ubicaciones Geográficas
              </label>
            </div>

            {/* Selector de departamento */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Departamento
              </label>
              <select
                value={selectedDepartment || ''}
                onChange={(e) => setSelectedDepartment(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loadingDepartments}
              >
                <option value="">-- Selecciona un departamento --</option>
                {departments.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de municipio */}
            {selectedDepartment && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Municipio
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addMunicipality(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loadingMunicipalities}
                >
                  <option value="">-- Selecciona un municipio --</option>
                  {municipalities.map((mun) => (
                    <option
                      key={mun.code}
                      value={mun.code}
                      disabled={formData.targetAudience.municipalityCodes.includes(mun.code)}
                    >
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ubicaciones seleccionadas */}
            <div className="space-y-2">
              {formData.targetAudience.municipalityCodes.map((code) => {
                const allMunicipalities = departments.flatMap(dept =>
                  municipalities.filter(m => m.departmentCode === dept.code)
                );
                const municipality = allMunicipalities.find(m => m.code === code);
                const department = departments.find(d => d.code === municipality?.departmentCode);
                
                return (
                  <div
                    key={code}
                    className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2"
                  >
                    <span>{municipality?.name}, {department?.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMunicipality(code)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {formData.targetAudience.municipalityCodes.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Sin ubicaciones específicas (el anuncio se mostrará en todo el país)
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Creando...' : 'Crear Anuncio'}
          </button>
        </div>
      </form>
    </div>
  );
}