'use client';

import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import type { BrandingMunicipality } from '@/services/BrandingRequestService';

interface Props {
  selectedCategoryIds: number[];
  selectedMunicipalityCodes: string[];
  onChangeCategoryIds: (ids: number[]) => void;
  onChangeMunicipalityCodes: (codes: string[]) => void;
  preloadedMunicipalities?: BrandingMunicipality[];
}

export const CampaignTargetingSelector: React.FC<Props> = ({
  selectedCategoryIds,
  selectedMunicipalityCodes,
  onChangeCategoryIds,
  onChangeMunicipalityCodes,
  preloadedMunicipalities,
}) => {
  const [selectedDept, setSelectedDept] = useState('');

  const { categories, loading: loadingCats } = useCategories();
  const { departments, loading: loadingDepts } = useDepartments();
  const { municipalities: deptMunicipalities, loading: loadingMunis } = useMunicipalities(
    selectedDept || null
  );

  // Mapa code → name para chips (preloaded + los del departamento activo)
  const municipalityNames = new Map<string, string>([
    ...(preloadedMunicipalities?.map(m => [m.code, m.name] as [string, string]) ?? []),
    ...deptMunicipalities.map(m => [m.code, m.name] as [string, string]),
  ]);

  const toggleCategory = (id: number) => {
    onChangeCategoryIds(
      selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter(c => c !== id)
        : [...selectedCategoryIds, id]
    );
  };

  const toggleMunicipality = (code: string) => {
    onChangeMunicipalityCodes(
      selectedMunicipalityCodes.includes(code)
        ? selectedMunicipalityCodes.filter(c => c !== code)
        : [...selectedMunicipalityCodes, code]
    );
  };

  const selectCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-5">
      {/* ── Categorías ── */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Categorías</p>
        {loadingCats ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Cargando categorías...
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400">Sin categorías disponibles</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {categories.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Municipios ── */}
      <div>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-sm font-medium text-gray-700">Municipios objetivo</p>
          {selectedMunicipalityCodes.length === 0 && (
            <span className="text-xs text-gray-400">Sin selección = todo Colombia</span>
          )}
        </div>

        {/* Chips de seleccionados */}
        {selectedMunicipalityCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedMunicipalityCodes.map(code => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
              >
                {municipalityNames.get(code) ?? code}
                <button
                  type="button"
                  onClick={() => toggleMunicipality(code)}
                  className="text-blue-400 hover:text-blue-600 cursor-pointer leading-none"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Selector de departamento */}
        {loadingDepts ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Cargando departamentos...
          </div>
        ) : (
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className={selectCls}
          >
            <option value="">Selecciona un departamento para agregar municipios...</option>
            {departments.map(d => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        )}

        {/* Lista de municipios del departamento */}
        {selectedDept && (
          <div className="mt-2 border border-gray-100 rounded-lg p-3 max-h-52 overflow-y-auto">
            {loadingMunis ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={13} className="animate-spin" /> Cargando municipios...
              </div>
            ) : deptMunicipalities.length === 0 ? (
              <p className="text-sm text-gray-400">Sin municipios disponibles</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {deptMunicipalities.map(m => (
                  <label
                    key={m.code}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMunicipalityCodes.includes(m.code)}
                      onChange={() => toggleMunicipality(m.code)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
