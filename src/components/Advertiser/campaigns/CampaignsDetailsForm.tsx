// components/campaigns/CampaignDetailsForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Info, AlertCircle, LinkIcon, Tag, MapPin, X, Coins, Calculator, Award, TrendingUp } from 'lucide-react';
import { Campaign, CampaignDetails } from '@/types/games/campaigns';
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
  // Campos de configuración de recompensas y monedas
  const [coinValue, setCoinValue] = useState('0.01'); // Valor de cada moneda en dinero real
  const [completionCoins, setCompletionCoins] = useState('10'); // Monedas por completar el juego
  const [budgetCoins, setBudgetCoins] = useState('1000'); // Presupuesto total en monedas
  const [maxCoinsPerSession, setMaxCoinsPerSession] = useState('15'); // Máximo de monedas por sesión
  const [maxSessionsPerUserPerDay, setMaxSessionsPerUserPerDay] = useState('3'); // Máximo de sesiones por usuario por día
  
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
    coinValue?: string;
    completionCoins?: string;
    budgetCoins?: string;
    maxCoinsPerSession?: string;
    maxSessionsPerUserPerDay?: string;
    targetUrl?: string;
    categoryIds?: string;
  }>({});

  // Hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);

  // Calcular presupuesto total (coinValue * budgetCoins)
  const calculateBudget = (): number => {
    const coinVal = parseFloat(coinValue);
    const budgetCoin = parseInt(budgetCoins);
    
    if (isNaN(coinVal) || isNaN(budgetCoin)) return 0;
    return coinVal * budgetCoin;
  };

  // Cargar datos de campaña existente
  useEffect(() => {
    if (existingCampaign) {
      // Cargar configuración de monedas y recompensas
      setCoinValue(existingCampaign.coinValue.toString());
      setCompletionCoins(existingCampaign.completionCoins.toString());
      setBudgetCoins(existingCampaign.budgetCoins.toString());
      setMaxCoinsPerSession(existingCampaign.maxCoinsPerSession.toString());
      setMaxSessionsPerUserPerDay(existingCampaign.maxSessionsPerUserPerDay.toString());
      
      // Cargar datos básicos
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

    // Validar coinValue
    const coinVal = parseFloat(coinValue);
    if (!coinValue || isNaN(coinVal) || coinVal <= 0) {
      newErrors.coinValue = 'El valor de moneda debe ser mayor a 0';
    } else if (coinVal < 0.01) {
      newErrors.coinValue = 'El valor mínimo por moneda es $0.01';
    } else if (coinVal > 100) {
      newErrors.coinValue = 'El valor máximo por moneda es $100';
    }

    // Validar completionCoins
    const compCoins = parseInt(completionCoins);
    if (!completionCoins || isNaN(compCoins) || compCoins < 0) {
      newErrors.completionCoins = 'Las monedas de completación deben ser 0 o más';
    }

    // Validar budgetCoins
    const budgetCoin = parseInt(budgetCoins);
    if (!budgetCoins || isNaN(budgetCoin) || budgetCoin <= 0) {
      newErrors.budgetCoins = 'El presupuesto en monedas debe ser mayor a 0';
    }

    // Validar maxCoinsPerSession
    const maxCoins = parseInt(maxCoinsPerSession);
    if (!maxCoinsPerSession || isNaN(maxCoins) || maxCoins <= 0) {
      newErrors.maxCoinsPerSession = 'Las monedas máximas por sesión deben ser mayor a 0';
    }

    // Validar que maxCoinsPerSession >= completionCoins
    if (!isNaN(maxCoins) && !isNaN(compCoins) && maxCoins < compCoins) {
      newErrors.maxCoinsPerSession = 'Debe ser mayor o igual a las monedas de completación';
    }

    // Validar maxSessionsPerUserPerDay
    const maxSessions = parseInt(maxSessionsPerUserPerDay);
    if (!maxSessionsPerUserPerDay || isNaN(maxSessions) || maxSessions <= 0) {
      newErrors.maxSessionsPerUserPerDay = 'Las sesiones máximas por día deben ser mayor a 0';
    }

    // Validar presupuesto calculado
    const totalBudget = calculateBudget();
    if (totalBudget < 10) {
      newErrors.budgetCoins = 'El presupuesto total debe ser al menos $10';
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
      coinValue: parseFloat(coinValue),
      completionCoins: parseInt(completionCoins),
      budgetCoins: parseInt(budgetCoins),
      maxCoinsPerSession: parseInt(maxCoinsPerSession),
      maxSessionsPerUserPerDay: parseInt(maxSessionsPerUserPerDay),
      budget: calculateBudget(),
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

  const budget = calculateBudget();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Configuración de Monedas y Recompensas */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center mb-4">
          <Coins className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-bold text-gray-900">Sistema de Recompensas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valor de Moneda */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor por Moneda ($) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={coinValue}
                onChange={(e) => setCoinValue(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.coinValue ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-purple-500`}
                placeholder="0.01"
                required
              />
            </div>
            {errors.coinValue && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.coinValue}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Cuánto vale cada moneda en dinero real
            </p>
          </div>

          {/* Presupuesto en Monedas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Presupuesto en Monedas *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Coins className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="1"
                value={budgetCoins}
                onChange={(e) => setBudgetCoins(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.budgetCoins ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-purple-500`}
                placeholder="1000"
                required
              />
            </div>
            {errors.budgetCoins && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.budgetCoins}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Total de monedas disponibles para la campaña
            </p>
          </div>

          {/* Monedas de Completación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monedas por Completar *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Award className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                value={completionCoins}
                onChange={(e) => setCompletionCoins(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.completionCoins ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-purple-500`}
                placeholder="10"
                required
              />
            </div>
            {errors.completionCoins && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.completionCoins}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Monedas ganadas al completar el juego
            </p>
          </div>

          {/* Máximo de Monedas por Sesión */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Máximo por Sesión *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="1"
                value={maxCoinsPerSession}
                onChange={(e) => setMaxCoinsPerSession(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.maxCoinsPerSession ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-purple-500`}
                placeholder="15"
                required
              />
            </div>
            {errors.maxCoinsPerSession && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.maxCoinsPerSession}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Monedas máximas que se pueden ganar por sesión
            </p>
          </div>

          {/* Sesiones Máximas por Usuario por Día */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Máximo Sesiones por Usuario/Día *
            </label>
            <input
              type="number"
              min="1"
              value={maxSessionsPerUserPerDay}
              onChange={(e) => setMaxSessionsPerUserPerDay(e.target.value)}
              className={`w-full md:w-1/2 px-3 py-2.5 border ${
                errors.maxSessionsPerUserPerDay ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-purple-500`}
              placeholder="3"
              required
            />
            {errors.maxSessionsPerUserPerDay && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.maxSessionsPerUserPerDay}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Cuántas sesiones puede jugar un usuario por día
            </p>
          </div>
        </div>

        {/* Cálculo del Presupuesto Total */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-purple-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-1">
                <Calculator className="w-5 h-5 text-purple-600 mr-2" />
                <p className="text-sm text-gray-600 font-semibold">Presupuesto Total Calculado</p>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                ${parseFloat(coinValue || '0').toFixed(4)} × {parseInt(budgetCoins || '0').toLocaleString()} monedas
              </p>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              ${budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
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
      {budget > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Resumen de la Campaña</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Presupuesto Total: <strong>${budget.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}</strong></li>
            <li>• Valor por Moneda: <strong>${parseFloat(coinValue).toFixed(4)}</strong></li>
            <li>• Monedas Totales: <strong>{parseInt(budgetCoins).toLocaleString()}</strong></li>
            <li>• Monedas por Completar: <strong>{completionCoins}</strong></li>
            <li>• Máximo por Sesión: <strong>{maxCoinsPerSession}</strong></li>
            <li>• Sesiones Máx/Usuario/Día: <strong>{maxSessionsPerUserPerDay}</strong></li>
            <li>• Categorías: <strong>{categoryIds.length} seleccionada(s)</strong></li>
            <li>• Edad: <strong>{minAge} - {maxAge} años</strong></li>
            <li>• Género: <strong>{gender === 'ALL' ? 'Todos' : gender === 'MALE' ? 'Masculino' : 'Femenino'}</strong></li>
            <li>• Ubicaciones: <strong>{municipalityCodes.length > 0 ? `${municipalityCodes.length} municipio(s)` : 'Todo el país'}</strong></li>
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