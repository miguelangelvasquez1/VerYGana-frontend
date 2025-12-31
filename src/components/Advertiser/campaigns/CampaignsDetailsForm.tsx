// components/campaigns/CampaignDetailsForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Info, AlertCircle, LinkIcon, Tag, MapPin, X } from 'lucide-react';
import { Campaign, CampaignDetails } from '@/types/campaigns';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';

interface CampaignDetailsFormProps {
  initialDetails: CampaignDetails;
  onSubmit: (details: CampaignDetails) => void;
  onCancel: () => void;
  existingCampaign?: Campaign | null;
}

export function CampaignDetailsForm({
  initialDetails,
  onSubmit,
  onCancel,
  existingCampaign,
}: CampaignDetailsFormProps) {
  const [budget, setBudget] = useState(initialDetails.budget.toString());
  const [targetUrl, setTargetUrl] = useState(initialDetails.targetUrl || '');
  const [categoryIds, setCategoryIds] = useState<number[]>(initialDetails.categoryIds || []);
  const [minAge, setMinAge] = useState(initialDetails.targetAudience?.minAge || 18);
  const [maxAge, setMaxAge] = useState(initialDetails.targetAudience?.maxAge || 65);
  const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>(
    initialDetails.targetAudience?.gender || 'ALL'
  );
  const [municipalityCodes, setMunicipalityCodes] = useState<string[]>(
    initialDetails.targetAudience?.municipalityCodes || []
  );
  
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<
    { code: string; name: string; departmentCode: string; departmentName: string }[]
  >([]);
  
  const [errors, setErrors] = useState<{
    budget?: string;
    targetUrl?: string;
    categoryIds?: string;
  }>({});

  // Hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);

  // Cargar datos de campaña existente
  useEffect(() => {
    if (existingCampaign) {
      // Cargar datos básicos
      setBudget(existingCampaign.budget.toString());
      setTargetUrl(existingCampaign.targetUrl || '');
      
      // Cargar categorías existentes
      const existingCategoryIds = existingCampaign.categories.map(cat => cat.id);
      setCategoryIds(existingCategoryIds);
      
      // Cargar edades
      setMinAge(existingCampaign.minAge);
      setMaxAge(existingCampaign.maxAge);
      
      // Cargar género
      setGender(existingCampaign.targetGender);
      
      // Cargar municipios existentes con toda su información
      if (existingCampaign.targetMunicipalities && existingCampaign.targetMunicipalities.length > 0) {
        const municipalityCodes = existingCampaign.targetMunicipalities.map(m => m.code);
        setMunicipalityCodes(municipalityCodes);
        
        // Mapear los municipios existentes al formato correcto
        const initialSelectedMunicipalities = existingCampaign.targetMunicipalities.map(m => ({
          code: m.code,
          name: m.name,
          departmentCode: m.departmentCode,
          departmentName: m.departmentName
        }));
        setSelectedMunicipalitiesData(initialSelectedMunicipalities);
      }
    }
  }, [existingCampaign]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validar presupuesto
    const budgetNum = parseFloat(budget);
    if (!budget || budgetNum <= 0) {
      newErrors.budget = 'El presupuesto debe ser mayor a 0';
    } else if (budgetNum < 10) {
      newErrors.budget = 'El presupuesto mínimo es $10';
    }

    // Validar URL si está presente
    if (targetUrl && targetUrl.trim()) {
      try {
        new URL(targetUrl);
      } catch {
        newErrors.targetUrl = 'URL inválida';
      }
    }

    // Validar categorías
    if (categoryIds.length === 0) {
      newErrors.categoryIds = 'Debes seleccionar al menos una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const details: CampaignDetails = {
      budget: parseFloat(budget),
      targetUrl: targetUrl.trim() || null,
      categoryIds,
      targetAudience: {
        minAge,
        maxAge,
        gender,
        municipalityCodes,
      },
    };

    onSubmit(details);
  };

  const toggleCategory = (categoryId: number) => {
    setCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addMunicipality = (municipalityCode: string) => {
    if (!municipalityCodes.includes(municipalityCode)) {
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

      setMunicipalityCodes(prev => [...prev, municipalityCode]);
    }
  };

  const removeMunicipality = (municipalityCode: string) => {
    setSelectedMunicipalitiesData(prev => 
      prev.filter(m => m.code !== municipalityCode)
    );
    setMunicipalityCodes(prev => prev.filter(m => m !== municipalityCode));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Presupuesto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Presupuesto de la campaña *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.01"
            min="10"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={`block w-full pl-10 pr-3 py-3 border ${
              errors.budget ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
            placeholder="100.00"
            required
          />
        </div>
        {errors.budget && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.budget}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          Este será el presupuesto máximo que se gastará en esta campaña
        </p>
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
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className={`w-full px-3 py-2 border ${
            errors.targetUrl ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          placeholder="https://ejemplo.com/tu-pagina"
          maxLength={500}
        />
        {errors.targetUrl && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.targetUrl}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Link al que se redirigirá cuando los usuarios interactúen con tu campaña
        </p>
      </div>

      {/* Categorías */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Tag className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-base font-semibold text-gray-900">Categorías / Intereses *</h3>
        </div>

        {loadingCategories ? (
          <p className="text-sm text-gray-500">Cargando categorías...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  categoryIds.includes(category.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={categoryIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">{category.name}</span>
              </label>
            ))}
          </div>
        )}
        
        {errors.categoryIds && (
          <p className="text-sm text-red-600 mt-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.categoryIds}
          </p>
        )}
      </div>

      {/* Audiencia objetivo */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Audiencia Objetivo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rango de edad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Edad
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="13"
                max="100"
              />
              <span className="text-gray-600">a</span>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="13"
                max="100"
              />
              <span className="text-gray-600">años</span>
            </div>
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'ALL' | 'MALE' | 'FEMALE')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
          </div>
        </div>

        {/* Ubicaciones geográficas */}
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-green-600 mr-2" />
            <label className="block text-sm font-medium text-gray-700">
              Ubicaciones Geográficas (Opcional)
            </label>
          </div>

          {/* Selector de departamento */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              Seleccionar Departamento
            </label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              <label className="block text-sm text-gray-600 mb-2">
                Seleccionar Municipio
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addMunicipality(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={loadingMunicipalities}
              >
                <option value="">-- Selecciona un municipio --</option>
                {municipalities.map((mun) => (
                  <option
                    key={mun.code}
                    value={mun.code}
                    disabled={municipalityCodes.includes(mun.code)}
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
              <p className="text-sm text-gray-500">
                Sin ubicaciones específicas (la campaña se mostrará en todo el país)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen */}
      {budget && parseFloat(budget) > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Resumen</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Presupuesto: ${parseFloat(budget).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}</li>
            <li>• Categorías: {categoryIds.length} seleccionada(s)</li>
            <li>• Edad: {minAge} - {maxAge} años</li>
            <li>• Género: {gender === 'ALL' ? 'Todos' : gender === 'MALE' ? 'Masculino' : 'Femenino'}</li>
            <li>• Ubicaciones: {municipalityCodes.length > 0 ? `${municipalityCodes.length} municipio(s)` : 'Todo el país'}</li>
          </ul>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          {existingCampaign ? 'Guardar Cambios' : 'Continuar'}
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}