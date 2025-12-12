// components/ads/EditAdModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, DollarSign, Heart, Calculator, Calendar, MapPin, Tag, Link as LinkIcon, Save, Loader2 } from 'lucide-react';
import { AdResponseDTO } from '@/types/advertiser';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { adService } from '@/services/adService';

interface EditAdModalProps {
  ad: AdResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditAdFormData {
  title: string;
  description: string;
  rewardPerLike: number;
  maxLikes: number;
  totalBudget: number;
  categoryIds: number[];
  startDate: string;
  endDate: string;
  targetUrl: string;
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    municipalityCodes: string[];
  };
}

export function EditAdModal({ ad, isOpen, onClose, onSuccess }: EditAdModalProps) {
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
      municipalityCodes: []
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { categories, loading: loadingCategories } = useCategories();
  const { departments } = useDepartments();
  const { municipalities } = useMunicipalities(selectedDepartment);

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
      categoryIds: formData.categoryIds,
      targetMunicipalitiesCodes: formData.targetAudience.municipalityCodes,
      minAge: formData.targetAudience.ageRange[0],
      maxAge: formData.targetAudience.ageRange[1],
      targetGender: formData.targetAudience.gender.toUpperCase(),
    };

    const formDataToSend = new FormData();
    formDataToSend.append('ad', new Blob([JSON.stringify(adDto)], { type: 'application/json' }));

    try {
      setSubmitting(true);
      await adService.updateAd(ad.id, formDataToSend);
      alert('Anuncio actualizado con éxito');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar anuncio:', error);
      alert(error.response?.data?.message || 'Error al actualizar anuncio');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Anuncio</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {ad.id}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Tag className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Categorías / Intereses</h3>
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
          </div>

          {/* Audiencia objetivo */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Audiencia Objetivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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