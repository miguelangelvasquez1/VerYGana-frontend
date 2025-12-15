// components/ads/EditAdModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Upload, Calculator, Tag, Link as LinkIcon, Save, Loader2, MapPin, Calendar } from 'lucide-react';
import { AdResponseDTO, EditAdFormData, SelectedMunicipalityData } from '@/types/ads/advertiser';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { useUpdateAd } from '@/hooks/ads/mutations';

interface EditAdModalProps {
  ad: AdResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAdModal({ ad, isOpen, onClose, onSuccess }: EditAdModalProps) {

  // Inicializar selectedMunicipalitiesData a partir del ad (si viene)
  const initialSelectedMunicipalities: SelectedMunicipalityData[] = (ad.targetMunicipalities ?? []).map(m => ({
    code: m.code,
    name: m.name,
    departmentCode: m.departmentCode,
    departmentName: m.departmentName ?? '' // si no existe, cadena vacía
  }));

  const [formData, setFormData] = useState<EditAdFormData>({
    title: ad.title,
    description: ad.description,
    rewardPerLike: ad.rewardPerLike,
    maxLikes: ad.maxLikes,
    totalBudget: ad.totalBudget,
    categoryIds: ad.categories.map(c => c.id),
    startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : '',
    endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : '',
    mediaType: (ad.mediaType || '').toString().toLowerCase() === 'video' ? 'video' : 'image',
    targetUrl: ad.targetUrl || '',
    file: null,
    targetAudience: {
      ageRange: [ad.minAge, ad.maxAge],
      gender: (ad.targetGender?.toLowerCase() ?? 'all') as 'all' | 'male' | 'female',
      municipalityCodes: (ad.targetMunicipalities ?? []).map(m => m.code)
    }
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<SelectedMunicipalityData[]>(initialSelectedMunicipalities);
  const [filePreview, setFilePreview] = useState<string | null>(ad.contentUrl);

  // React Query hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);
  const updateAdMutation = useUpdateAd();

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

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const validateFileByTypeAndSize = (file: File, type: 'image' | 'video') => {
    if (type === 'image') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (!allowed.includes(file.type)) return 'Formato de imagen no permitido';
      if (file.size > maxBytes) return 'Imagen supera 5MB';
    } else {
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
      const maxBytes = 100 * 1024 * 1024; // 100MB
      if (!allowed.includes(file.type)) return 'Formato de video no permitido';
      if (file.size > maxBytes) return 'Video supera 100MB';
    }
    return null;
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFileByTypeAndSize(file, formData.mediaType);
      if (err) return alert(err);


      setFormData(prev => ({ ...prev, file }));


      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addMunicipality = (municipalityCode: string) => {
    if (!formData.targetAudience.municipalityCodes.includes(municipalityCode)) {
      const municipality = municipalities.find(m => m.code === municipalityCode);
      const department = departments.find(d => d.code === selectedDepartment);

      if (municipality && department) {
        setSelectedMunicipalitiesData(prev => [
          ...prev,
          {
            code: municipality.code,
            name: municipality.name,
            departmentCode: department.code,
            departmentName: department.name
          }
        ]);
      }

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
    setSelectedMunicipalitiesData(prev =>
      prev.filter(m => m.code !== municipalityCode)
    );

    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        municipalityCodes: prev.targetAudience.municipalityCodes.filter(m => m !== municipalityCode)
      }
    }));
  };

  const handleTypeChange = (mediaType: 'image' | 'video') => {
    setFormData(prev => ({ ...prev, mediaType, file: null }));
    // si preferimos limpiar preview cuando se cambia de tipo:
    setFilePreview(ad.contentUrl || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.categoryIds.length === 0) {
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    const adDto = {
      title: formData.title,
      description: formData.description,
      rewardPerLike: formData.rewardPerLike,
      maxLikes: formData.maxLikes,
      targetUrl: formData.targetUrl || null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      mediaType: formData.mediaType,
      categoryIds: formData.categoryIds,
      targetMunicipalitiesCodes: formData.targetAudience.municipalityCodes,
      minAge: formData.targetAudience.ageRange[0],
      maxAge: formData.targetAudience.ageRange[1],
      targetGender: formData.targetAudience.gender.toUpperCase(),
    };

    const formDataToSend = new FormData();
    formDataToSend.append('ad', new Blob([JSON.stringify(adDto)], { type: 'application/json' }));

    // Agregar archivo solo si se seleccionó uno nuevo
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
      await updateAdMutation.mutateAsync({ id: ad.id, formData: formDataToSend });
      alert('Anuncio actualizado con éxito');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar anuncio');
    }
  };

  const submitting = updateAdMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Anuncio</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {ad.id} • Estado: {ad.status}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Título del Anuncio
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={5}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={10}
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center">
                  <LinkIcon className="w-4 h-4 mr-1" />
                  URL de Destino (Opcional)
                </div>
              </label>
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
            </div>
          </div>

          {/* Cambiar archivo multimedia */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <Upload className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Cambiar Archivo Multimedia</h3>
            </div>


            {/* Selector de tipo (imagen / video) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Anuncio</label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="image"
                    checked={formData.mediaType === 'image'}
                    onChange={() => handleTypeChange('image')}
                    className="mr-2"
                  />
                  Imagen
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="video"
                    checked={formData.mediaType === 'video'}
                    onChange={() => handleTypeChange('video')}
                    className="mr-2"
                  />
                  Video
                </label>
              </div>
            </div>


            {/* Preview actual */}
            {filePreview && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa actual:</p>
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {ad.mediaType === 'VIDEO' || formData.mediaType === 'video' ? (
                    <video src={filePreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">
                    Subir nuevo archivo (opcional)
                  </label>

                  {/* Input simple (visible) */}
                  <input
                    type="file"
                    accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.mediaType === 'image'
                      ? 'Máx 5MB - JPG, PNG, WebP'
                      : 'Máx 100MB - MP4, WebM'}
                  </p>

                  {/* Mostrar nombre y botón para eliminar selección si hay file */}
                  {formData.file && (
                    <div className="mt-3 flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate">{formData.file.name}</span>
                      <button
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, file: null })); setFilePreview(ad.contentUrl || null); }}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Presupuesto y Recompensas */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <Calculator className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Presupuesto y Recompensas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recompensa por Like ($)
                </label>
                <input
                  type="number"
                  value={formData.rewardPerLike}
                  onChange={(e) => handleRewardChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.01"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Máximo de Likes
                </label>
                <input
                  type="number"
                  value={formData.maxLikes}
                  onChange={(e) => handleMaxLikesChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Presupuesto Total</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${formData.rewardPerLike.toFixed(2)} × {formData.maxLikes} likes
                  </p>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  ${formData.totalBudget.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Fechas de Campaña</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Finalización
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Tag className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Categorías / Intereses</h3>
            </div>

            {loadingCategories ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Cargando categorías...</span>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">No hay categorías disponibles</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.categoryIds.includes(category.id)
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
          </div>

          {/* Audiencia objetivo */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Audiencia Objetivo</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    min="13"
                    max="100"
                  />
                  <span className="text-gray-600 font-medium">a</span>
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
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    min="13"
                    max="100"
                  />
                  <span className="text-gray-600 font-medium">años</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>
            </div>

            {/* Ubicaciones */}
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-green-600 mr-2" />
                <label className="block text-sm font-semibold text-gray-700">
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
                    <option value="">
                      {loadingMunicipalities ? 'Cargando municipios...' : '-- Selecciona un municipio --'}
                    </option>
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
                {selectedMunicipalitiesData.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMunicipalitiesData.map((municipality) => (
                      <div
                        key={municipality.code}
                        className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{municipality.name}, {municipality.departmentName}</span>
                        <button
                          type="button"
                          onClick={() => removeMunicipality(municipality.code)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    Sin ubicaciones específicas (el anuncio se mostrará en todo el país)
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}