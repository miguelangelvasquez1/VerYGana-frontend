// components/forms/CreateAdForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Upload, X, DollarSign, Heart, Calculator, Calendar, MapPin, Tag, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { useAdUpload } from '@/hooks/ads/useAdUpload';
import { useRouter } from 'next/navigation';
import { AdDetails } from '@/types/ads/advertiser';
import toast from 'react-hot-toast';

interface CreateAdFormData {
  title: string;
  description: string;
  type: 'IMAGE' | 'VIDEO';
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
    type: 'IMAGE',
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

  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Custom hooks
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);

  const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<
    { code: string; name: string; departmentCode: string; departmentName: string }[]
  >([]);

  // Preparar AdDetails para el hook (useMemo para evitar recreaciones innecesarias)
  const adDetails: AdDetails = useMemo(() => ({
    title: formData.title,
    description: formData.description,
    rewardPerLike: formData.rewardPerLike,
    maxLikes: formData.maxLikes,
    mediaType: formData.type,
    targetUrl: formData.targetUrl || null,
    startDate: formData.startImmediately
      ? null
      : formData.startDate
      ? new Date(formData.startDate).toISOString()
      : null,
    endDate: formData.endWhenBudgetExhausted
      ? null
      : formData.endDate
      ? new Date(formData.endDate).toISOString()
      : null,
    categoryIds: formData.categoryIds,
    targetMunicipalitiesCodes: formData.targetAudience.municipalityCodes,
    minAge: formData.targetAudience.ageRange[0],
    maxAge: formData.targetAudience.ageRange[1],
    targetGender: formData.targetAudience.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'ALL',
  }), [formData]);

  // Hook de subida con el nuevo sistema
  const { uploadState, fileState, uploadAd, resetUpload } = useAdUpload({ adDetails });

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

  // Submit usando el nuevo hook
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

    // Usar el hook para subir (el hook ya tiene los adDetails actualizados)
    const result = await uploadAd(formData.file);

    if (result.ok) {
      toast.success(`¡Anuncio creado con éxito! ID: ${result.adId}`);
      router.push('/advertiser/ads');
    } else {
      toast.error(result.errorMsg);
    }
  };

  const isSubmitting = uploadState.status !== 'idle' && uploadState.status !== 'error';

  // Función para renderizar el estado de subida
  const renderUploadStatus = () => {
    if (uploadState.status === 'idle') return null;

    const statusConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
      preparing: {
        icon: <Loader2 className="w-5 h-5 animate-spin text-blue-600" />,
        text: '📦 Preparando subida...',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      },
      uploading: {
        icon: <Loader2 className="w-5 h-5 animate-spin text-purple-600" />,
        text: `📤 Subiendo archivo... ${fileState?.progress?.toFixed(0) || 0}%`,
        color: 'bg-purple-50 border-purple-200 text-purple-800'
      },
      creating: {
        icon: <Loader2 className="w-5 h-5 animate-spin text-green-600" />,
        text: '✨ Creando anuncio...',
        color: 'bg-green-50 border-green-200 text-green-800'
      },
      success: {
        icon: <span className="text-2xl">✅</span>,
        text: '¡Anuncio creado exitosamente!',
        color: 'bg-green-50 border-green-200 text-green-800'
      },
      error: {
        icon: <span className="text-2xl">❌</span>,
        text: `Error: ${uploadState.error || 'Error desconocido'}`,
        color: 'bg-red-50 border-red-200 text-red-800'
      }
    };

    const config = statusConfig[uploadState.status];

    return (
      <div className={`rounded-lg border-2 p-4 ${config.color}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {config.icon}
            <span className="font-medium">{config.text}</span>
          </div>
          {uploadState.currentFile && (
            <span className="text-sm opacity-75">{uploadState.currentFile}</span>
          )}
        </div>

        {/* Barra de progreso */}
        {uploadState.progress > 0 && uploadState.status !== 'error' && (
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-white/50">
              <div
                className="h-2 rounded-full bg-current transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-right opacity-75">
              {uploadState.progress.toFixed(0)}%
            </p>
          </div>
        )}

        {/* Botón de reintentar en caso de error */}
        {uploadState.status === 'error' && (
          <button
            type="button"
            onClick={resetUpload}
            className="mt-3 w-full px-4 py-2 bg-white border border-current rounded-md hover:bg-current/10 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Anuncio</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Estado de subida */}
        {renderUploadStatus()}

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                <label htmlFor="startImmediately" className="text-sm font-medium text-gray-700">
                  Iniciar cuando el administrador apruebe el anuncio
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                value="IMAGE"
                checked={formData.type === 'IMAGE'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'IMAGE', file: null }))}
                className="mr-2"
                disabled={isSubmitting}
              />
              Imagen
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="VIDEO"
                checked={formData.type === 'VIDEO'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'VIDEO', file: null }))}
                className="mr-2"
                disabled={isSubmitting}
              />
              Video
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subir {formData.type === 'IMAGE' ? 'Imagen' : 'Video'}
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={!isSubmitting ? handleDrag : undefined}
            onDragLeave={!isSubmitting ? handleDrag : undefined}
            onDragOver={!isSubmitting ? handleDrag : undefined}
            onDrop={!isSubmitting ? handleDrop : undefined}
          >
            {formData.file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-gray-600">{formData.file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    className="text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Estado del archivo durante la subida */}
                {fileState && (
                  <div className="mt-2 text-sm">
                    {fileState.uploading && (
                      <div className="flex items-center justify-center space-x-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subiendo: {fileState.progress?.toFixed(0)}%</span>
                      </div>
                    )}
                    {fileState.uploaded && (
                      <p className="text-green-600 flex items-center justify-center">
                        <span className="mr-1">✓</span> Archivo subido exitosamente
                      </p>
                    )}
                    {fileState.error && (
                      <p className="text-red-600 flex items-center justify-center">
                        <span className="mr-1">✗</span> {fileState.error}
                      </p>
                    )}
                  </div>
                )}
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
                      accept={formData.type === 'IMAGE' ? 'image/*' : 'video/*'}
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'IMAGE' ? 'Máx 5MB - JPG, PNG, WebP' : 'Máx 100MB - MP4, WebM'}
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
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="mr-2"
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={loadingDepartments || isSubmitting}
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
                  disabled={loadingMunicipalities || isSubmitting}
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
                        disabled={isSubmitting}
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

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Creando anuncio...' : 'Crear Anuncio'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}