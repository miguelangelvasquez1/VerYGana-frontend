// components/ads/EditAdModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Calculator, Tag, Link as LinkIcon, Save, Loader2, MapPin, Calendar, Info } from 'lucide-react';
import { AdResponseDTO, EditAdFormData, SelectedMunicipalityData } from '@/types/ads/commercial';
import { AdUpdateDTO } from '@/types/ads/commercial';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { useUpdateAd } from '@/hooks/ads/mutations';
import toast from 'react-hot-toast';
import { usePlanState } from '../layout/DashboardLayout';

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
    targetUrl: ad.targetUrl || '',
    targetAudience: {
      ageRange: [ad.minAge, ad.maxAge],
      gender: (ad.targetGender?.toLowerCase() ?? 'all') as 'all' | 'male' | 'female',
      municipalityCodes: (ad.targetMunicipalities ?? []).map(m => m.code)
    }
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<SelectedMunicipalityData[]>(initialSelectedMunicipalities);

  // React Query hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);
  const updateAdMutation = useUpdateAd();
  const { refreshPlan } = usePlanState();

  const calculateBudget = (reward: number, maxLikes: number) => {
    return (reward * maxLikes).toFixed(2);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.categoryIds.length === 0) {
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    const updateDto: AdUpdateDTO = {
      title: formData.title,
      description: formData.description,
      maxLikes: formData.maxLikes,
      targetUrl: formData.targetUrl || undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      categoryIds: formData.categoryIds,
      targetMunicipalitiesCodes: formData.targetAudience.municipalityCodes,
      minAge: formData.targetAudience.ageRange[0],
      maxAge: formData.targetAudience.ageRange[1],
      targetGender: formData.targetAudience.gender.toUpperCase() as 'ALL' | 'MALE' | 'FEMALE',
    };

    try {
      await updateAdMutation.mutateAsync({ id: ad.id, updateDto });
      await refreshPlan();
      toast.success('Anuncio actualizado con éxito');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Error al actualizar anuncio: ' + (error.response?.data?.message || 'Error desconocido'));
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

          {/* Vista previa del archivo multimedia (solo lectura) */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-300">
            <div className="flex items-center mb-4">
              <Info className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Archivo Multimedia Actual</h3>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> No es posible cambiar el archivo multimedia una vez creado el anuncio. 
                Si necesitas cambiar la imagen o video, deberás crear un nuevo anuncio.
              </p>
            </div>

            {ad.contentUrl && (
              <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                {ad.mediaType === 'VIDEO' ? (
                  <video src={ad.contentUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={ad.contentUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Tipo:</strong> {ad.mediaType === 'VIDEO' ? 'Video' : 'Imagen'}</p>
            </div>
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
                <div className="relative">
                  <input
                    type="number"
                    value={formData.rewardPerLike}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 
                              text-gray-400 cursor-not-allowed pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">No editable una vez creado el anuncio</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-semibold text-gray-700">Máximo de Likes</label>
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 
                                text-[11px] flex items-center justify-center hover:border-gray-400 
                                hover:text-gray-600 transition-colors"
                    >?</button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 
                                    bg-white border border-gray-200 rounded-lg p-3 text-xs 
                                    text-gray-600 shadow-lg hidden group-hover:block z-10 
                                    leading-relaxed pointer-events-none">
                      <p className="font-semibold text-gray-800 mb-1">¿Qué implica cambiar esto?</p>
                      <p className="mb-1">
                        <strong className="text-gray-700">Bajar:</strong> se te devuelve el presupuesto 
                        no consumido correspondiente a los likes liberados.
                      </p>
                      <p>
                        <strong className="text-gray-700">Subir:</strong> se deduce el costo adicional 
                        de tu saldo disponible.
                      </p>
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  value={formData.maxLikes}
                  onChange={(e) => handleMaxLikesChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={ad.currentLikes + 1}
                  max="10000"
                  step="1"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo permitido:{' '}
                  <strong className="text-gray-600">{ad.currentLikes + 1}</strong>
                  {' '}(likes actuales + 1)
                </p>
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

            {(() => {
              const originalReserved = ad.rewardPerLike * (ad.maxLikes - ad.currentLikes);
              const newReserved = formData.rewardPerLike * (formData.maxLikes - ad.currentLikes);
              const delta = newReserved - originalReserved;

              if (formData.maxLikes <= ad.currentLikes) return (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  El mínimo permitido es {ad.currentLikes + 1} (likes actuales + 1).
                </div>
              );
              if (delta > 0.001) return (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Se deducirán <strong>${delta.toFixed(2)}</strong> adicionales de tu saldo disponible.
                </div>
              );
              if (delta < -0.001) return (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  Se te devolverán <strong>${Math.abs(delta).toFixed(2)}</strong> a tu saldo disponible.
                </div>
              );
              return null;
            })()}

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg 
                flex gap-4 text-xs text-blue-700">
              <span>Likes consumidos: <strong>{ad.currentLikes}</strong></span>
              <span className="w-px bg-blue-200" />
              <span>Presupuesto consumido: 
                <strong> ${(ad.currentLikes * ad.rewardPerLike).toFixed(2)}</strong>
              </span>
              <span className="w-px bg-blue-200" />
              <span>Presupuesto restante: 
                <strong> ${((ad.maxLikes - ad.currentLikes) * ad.rewardPerLike).toFixed(2)}</strong>
              </span>
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
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha de Inicio</label>
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[11px] flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >?</button>
                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 shadow-lg hidden group-hover:block z-10 leading-relaxed pointer-events-none">
                      Fecha en que el anuncio comenzará a mostrarse. Si se deja vacío, inicia inmediatamente tras ser aprobado.
                    </div>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha de Finalización</label>
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[11px] flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >?</button>
                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 shadow-lg hidden group-hover:block z-10 leading-relaxed pointer-events-none">
                      Fecha límite del anuncio. Si se deja vacío, corre indefinidamente hasta alcanzar el máximo de likes.
                    </div>
                  </div>
                </div>
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