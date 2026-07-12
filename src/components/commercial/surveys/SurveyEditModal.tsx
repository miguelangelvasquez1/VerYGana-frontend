'use client';

import React, { useState } from 'react';
import { X, Loader2, Save, MapPin, Tag } from 'lucide-react';
import { useUpdateSurvey } from '@/hooks/surveys/useCommercialSurvey';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { GENDER_LABELS } from '@/hooks/surveys/surveyUtils';
import type { SurveyCommercialDetailDTO, UpdateSurveyRequest, TargetGender } from '@/types/survey.types';

interface MunicipalityData {
  code: string;
  name: string;
  departmentCode?: string;
  departmentName?: string;
}

interface Props {
  survey: SurveyCommercialDetailDTO;
  onClose: () => void;
}

export default function SurveyEditModal({ survey, onClose }: Props) {
  const updateMutation = useUpdateSurvey(survey.id);
  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();

  // ── Basic fields ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description ?? '');

  // ── Categories — IDs come directly from the API ────────────────────────────
  const [categoryIds, setCategoryIds] = useState<number[]>(
    (survey.categories ?? []).map((c) => c.id),
  );

  // ── Municipalities — full objects (code + name + department) from the API ───
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<MunicipalityData[]>(
    survey.targetMunicipalities ?? [],
  );

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);

  // ── Other targeting fields ──────────────────────────────────────────────────
  const [minAge, setMinAge] = useState(survey.minAge ? String(survey.minAge) : '');
  const [maxAge, setMaxAge] = useState(survey.maxAge ? String(survey.maxAge) : '');
  const [ageErrors, setAgeErrors] = useState<{ minAge?: string; maxAge?: string }>({});
  const [targetGender, setTargetGender] = useState<TargetGender | ''>(survey.targetGender ?? '');

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleCategory(id: number) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  // Matches EditAdModal.addMunicipality exactly
  function addMunicipality(municipalityCode: string) {
    if (selectedMunicipalities.some((m) => m.code === municipalityCode)) return;
    const municipality = municipalities.find((m) => m.code === municipalityCode);
    const department = departments.find((d) => d.code === selectedDepartment);
    if (municipality && department) {
      setSelectedMunicipalities((prev) => [
        ...prev,
        {
          code: municipality.code,
          name: municipality.name,
          departmentCode: department.code,
          departmentName: department.name,
        },
      ]);
    }
  }

  // Matches EditAdModal.removeMunicipality exactly
  function removeMunicipality(municipalityCode: string) {
    setSelectedMunicipalities((prev) => prev.filter((m) => m.code !== municipalityCode));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errs: { minAge?: string; maxAge?: string } = {};
    const minVal = minAge ? parseInt(minAge) : NaN;
    const maxVal = maxAge ? parseInt(maxAge) : NaN;

    if (!minAge) errs.minAge = 'La edad mínima es obligatoria';
    else if (minVal < 13 || minVal > 100) errs.minAge = 'Debe estar entre 13 y 100';

    if (!maxAge) errs.maxAge = 'La edad máxima es obligatoria';
    else if (maxVal < 13 || maxVal > 100) errs.maxAge = 'Debe estar entre 13 y 100';

    if (!errs.minAge && !errs.maxAge && minVal > maxVal)
      errs.minAge = 'La edad mínima no puede superar la máxima';

    if (Object.keys(errs).length > 0) {
      setAgeErrors(errs);
      return;
    }

    setAgeErrors({});

    const payload: UpdateSurveyRequest = {
      title: title.trim() || null,
      description: description.trim() || null,
      categoryIds: categoryIds.length > 0 ? categoryIds : null,
      municipalityCodes: selectedMunicipalities.map((m) => m.code),
      minAge: minVal,
      maxAge: maxVal,
      targetGender: targetGender || null,
    };

    updateMutation.mutate(payload, { onSuccess: () => onClose() });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Editar encuesta</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#03548C] focus:ring-2 focus:ring-[#03548C]/10"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#03548C] focus:ring-2 focus:ring-[#03548C]/10"
            />
          </div>

          {/* Categories */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Categorías</label>
            </div>
            {loadingCategories ? (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando categorías…
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat: { id: number; name: string }) => {
                  const active = categoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
                        active ? 'border-[#03548C] bg-[#03548C]/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleCategory(cat.id)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          active ? 'border-[#03548C] bg-[#00a4ff]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {active && (
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 5l2.5 2.5L8 2.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className={`truncate text-sm font-medium ${active ? 'text-[#03548C]' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Municipalities — identical pattern to EditAdModal */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Municipios objetivo</label>
            </div>

            {/* Department selector */}
            <select
              value={selectedDepartment ?? ''}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
              disabled={loadingDepartments}
              className="mb-2 w-full cursor-pointer rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#03548C] focus:ring-2 focus:ring-[#03548C]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">— Selecciona un departamento —</option>
              {departments.map((d: { code: string; name: string }) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>

            {/* Municipality selector — only visible when a department is chosen */}
            {selectedDepartment && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addMunicipality(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={loadingMunicipalities}
                className="mb-3 w-full cursor-pointer rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#03548C] focus:ring-2 focus:ring-[#03548C]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">
                  {loadingMunicipalities ? 'Cargando municipios…' : '— Selecciona un municipio —'}
                </option>
                {municipalities.map((m: { code: string; name: string }) => (
                  <option
                    key={m.code}
                    value={m.code}
                    disabled={selectedMunicipalities.some((s) => s.code === m.code)}
                  >
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Selected chips — same render as EditAdModal */}
            {selectedMunicipalities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMunicipalities.map((m) => (
                  <span
                    key={m.code}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <MapPin className="h-3 w-3" />
                    {m.name}{m.departmentName ? `, ${m.departmentName}` : ''}
                    <button
                      type="button"
                      onClick={() => removeMunicipality(m.code)}
                      className="cursor-pointer ml-0.5 text-emerald-500 hover:text-emerald-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Sin municipios específicos — se mostrará en todo el país.
              </p>
            )}
          </div>

          {/* Age range */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rango de edad <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  type="number" min={13} max={100} placeholder="Mín"
                  value={minAge}
                  onChange={(e) => { setMinAge(e.target.value); setAgeErrors((p) => ({ ...p, minAge: undefined })); }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#03548C]/10 ${ageErrors.minAge ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#03548C]'}`}
                />
                {ageErrors.minAge && <p className="mt-1 text-xs text-red-500">{ageErrors.minAge}</p>}
              </div>
              <span className="mt-2.5 text-gray-400">–</span>
              <div className="flex-1">
                <input
                  type="number" min={13} max={100} placeholder="Máx"
                  value={maxAge}
                  onChange={(e) => { setMaxAge(e.target.value); setAgeErrors((p) => ({ ...p, maxAge: undefined })); }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#03548C]/10 ${ageErrors.maxAge ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#03548C]'}`}
                />
                {ageErrors.maxAge && <p className="mt-1 text-xs text-red-500">{ageErrors.maxAge}</p>}
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Género objetivo</label>
            <div className="flex gap-2">
              {(['MALE', 'FEMALE', 'ALL'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTargetGender(g)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    targetGender === g
                      ? 'border-[#03548C] bg-[#03548C]/5 text-[#03548C]'
                      : 'border-gray-200 text-gray-600 hover:border-[#03548C]/40'
                  }`}
                >
                  {GENDER_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {/* Start date — set automatically by the backend on first publish/activation */}
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
            {survey.startsAt
              ? `Se activó el ${new Date(survey.startsAt).toLocaleString('es-CO')}.`
              : 'La fecha de inicio se fija automáticamente cuando publiques o actives la encuesta por primera vez.'}
          </p>

          {updateMutation.isError && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
              Error al guardar los cambios. Inténtalo de nuevo.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#03548C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1440] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
