"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { locationService, Department, Municipality } from "@/services/LocationService";
import { OptionalTargetAudienceDTO, TargetGender } from "@/types/TargetAudience.types";

export const EMPTY_TARGETING: OptionalTargetAudienceDTO = {};

export function isTargetAudienceEmpty(value: OptionalTargetAudienceDTO | null | undefined): boolean {
  if (!value) return true;
  return (
    (!value.municipalityCodes || value.municipalityCodes.length === 0) &&
    value.minAge == null &&
    value.maxAge == null &&
    !value.targetGender
  );
}

export function isTargetAudienceValid(value: OptionalTargetAudienceDTO | null | undefined): boolean {
  if (!value) return true;
  if (value.minAge != null && value.maxAge != null) {
    return value.maxAge >= value.minAge;
  }
  return true;
}

const GENDER_OPTIONS: { value: TargetGender | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
];

interface CodeInfo {
  name: string;
  departmentCode: string;
}

type ChipGroup =
  | { type: "department"; key: string; departmentCode: string; name: string }
  | { type: "municipality"; key: string; code: string; name: string };

interface Props {
  value: OptionalTargetAudienceDTO | null | undefined;
  onChange: (value: OptionalTargetAudienceDTO) => void;
  mode: "restriction" | "preference";
  disabled?: boolean;
}

export default function TargetAudienceFields({ value, onChange, mode, disabled }: Props) {
  const [expanded, setExpanded] = useState(!isTargetAudienceEmpty(value));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [codeInfo, setCodeInfo] = useState<Record<string, CodeInfo>>({});
  const [municipalitiesByDept, setMunicipalitiesByDept] = useState<Record<string, Municipality[]>>({});
  const [ageError, setAgeError] = useState("");

  const codes = value?.municipalityCodes ?? [];

  // Cargar departamentos al expandir la sección
  useEffect(() => {
    if (!expanded || departments.length > 0) return;
    locationService.getDepartments().then(setDepartments).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Hidratar nombre + departamento de municipios ya preseleccionados (prefill en edición)
  useEffect(() => {
    const unresolved = codes.filter((c) => !codeInfo[c]);
    if (unresolved.length === 0) return;

    Promise.all(
      unresolved.map((code) => locationService.getMunicipalityByCode(code).catch(() => null))
    ).then((results) => {
      setCodeInfo((prev) => {
        const next = { ...prev };
        results.forEach((m) => {
          if (m) next[m.code] = { name: m.name, departmentCode: m.departmentCode };
        });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.municipalityCodes]);

  // Cargar municipios del departamento seleccionado en el desplegable
  useEffect(() => {
    if (!selectedDept) {
      setMunicipalities([]);
      return;
    }
    if (municipalitiesByDept[selectedDept]) {
      setMunicipalities(municipalitiesByDept[selectedDept]);
      return;
    }
    setLoadingMunicipalities(true);
    locationService
      .getMunicipalities(selectedDept)
      .then((list) => {
        setMunicipalities(list);
        setMunicipalitiesByDept((prev) => ({ ...prev, [selectedDept]: list }));
        setCodeInfo((prev) => {
          const next = { ...prev };
          list.forEach((m) => {
            next[m.code] = { name: m.name, departmentCode: m.departmentCode };
          });
          return next;
        });
      })
      .catch(() => setMunicipalities([]))
      .finally(() => setLoadingMunicipalities(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDept]);

  // Precargar el listado completo de cualquier departamento que ya tenga
  // municipios seleccionados, para poder detectar "departamento completo"
  // aunque el usuario nunca lo haya navegado en esta sesión (prefill de edición).
  useEffect(() => {
    const deptCodes = Array.from(
      new Set(Object.values(codeInfo).map((info) => info.departmentCode))
    );
    const missing = deptCodes.filter((d) => !municipalitiesByDept[d]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map((d) => locationService.getMunicipalities(d).catch(() => [] as Municipality[]))
    ).then((results) => {
      setMunicipalitiesByDept((prev) => {
        const next = { ...prev };
        missing.forEach((d, i) => {
          next[d] = results[i];
        });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeInfo]);

  const emitChange = (patch: Partial<OptionalTargetAudienceDTO>) => {
    onChange({ ...(value ?? {}), ...patch });
  };

  const toggleMunicipality = (code: string) => {
    const set = new Set(codes);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    emitChange({ municipalityCodes: Array.from(set) });
  };

  const removeMunicipality = (code: string) => {
    emitChange({ municipalityCodes: codes.filter((c) => c !== code) });
  };

  const removeGroup = (group: ChipGroup) => {
    if (group.type === "municipality") {
      removeMunicipality(group.code);
      return;
    }
    const deptCodes = new Set((municipalitiesByDept[group.departmentCode] ?? []).map((m) => m.code));
    emitChange({ municipalityCodes: codes.filter((c) => !deptCodes.has(c)) });
  };

  const handleAgeChange = (field: "minAge" | "maxAge", raw: string) => {
    const num = raw === "" ? undefined : Number(raw);
    const nextMin = field === "minAge" ? num : value?.minAge ?? undefined;
    const nextMax = field === "maxAge" ? num : value?.maxAge ?? undefined;

    setAgeError(
      nextMin != null && nextMax != null && nextMax < nextMin
        ? "La edad máxima debe ser mayor o igual a la mínima"
        : ""
    );

    emitChange({ [field]: num } as Partial<OptionalTargetAudienceDTO>);
  };

  const filteredMunicipalities = municipalityFilter
    ? municipalities.filter((m) =>
        m.name.toLowerCase().includes(municipalityFilter.toLowerCase())
      )
    : municipalities;

  const deptMunicipalityCodes = municipalities.map((m) => m.code);
  const allDeptSelected =
    deptMunicipalityCodes.length > 0 && deptMunicipalityCodes.every((c) => codes.includes(c));
  const selectedDeptName = departments.find((d) => d.code === selectedDept)?.name ?? "";

  const toggleSelectAllDept = () => {
    const set = new Set(codes);
    if (allDeptSelected) {
      deptMunicipalityCodes.forEach((c) => set.delete(c));
    } else {
      deptMunicipalityCodes.forEach((c) => set.add(c));
    }
    emitChange({ municipalityCodes: Array.from(set) });
  };

  // Agrupa los códigos seleccionados: si un departamento está 100% seleccionado
  // se muestra un único chip con su nombre; si no, se listan sus municipios sueltos.
  const chipGroups = useMemo<ChipGroup[]>(() => {
    const byDept: Record<string, string[]> = {};
    const unresolved: string[] = [];

    codes.forEach((code) => {
      const info = codeInfo[code];
      if (!info) {
        unresolved.push(code);
        return;
      }
      (byDept[info.departmentCode] ??= []).push(code);
    });

    const groups: ChipGroup[] = [];

    Object.entries(byDept).forEach(([departmentCode, deptCodes]) => {
      const fullList = municipalitiesByDept[departmentCode];
      const departmentName =
        departments.find((d) => d.code === departmentCode)?.name ?? departmentCode;

      if (fullList && fullList.length > 0 && deptCodes.length === fullList.length) {
        groups.push({
          type: "department",
          key: `dept-${departmentCode}`,
          departmentCode,
          name: departmentName,
        });
      } else {
        deptCodes.forEach((code) => {
          groups.push({
            type: "municipality",
            key: code,
            code,
            name: codeInfo[code]?.name ?? code,
          });
        });
      }
    });

    unresolved.forEach((code) => {
      groups.push({ type: "municipality", key: code, code, name: code });
    });

    return groups;
  }, [codes, codeInfo, municipalitiesByDept, departments]);

  const copy =
    mode === "restriction"
      ? {
          title: "Disponibilidad",
          subtitle:
            "Restringe quién puede ver la rifa y reclamar tickets. Si no configuras nada, estará disponible para todo el mundo.",
        }
      : {
          title: "Preferencia de audiencia de catálogo",
          subtitle:
            "No restringe la venta: el producto sigue visible y disponible para comprar por cualquiera. Solo se mostrará priorizado en el catálogo para los consumidores que coincidan.",
        };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">🎯</span>
          <div>
            <h2 className="text-base font-bold text-gray-800">{copy.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{copy.subtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="p-6 space-y-5 border-t border-gray-100">
          {/* Municipios */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Municipios (opcional)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={disabled}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent transition-colors bg-white disabled:bg-gray-50"
              >
                <option value="">Selecciona un departamento...</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Filtrar municipios..."
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                disabled={disabled || !selectedDept}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent transition-colors disabled:bg-gray-50"
              />
            </div>

            {selectedDept && !loadingMunicipalities && deptMunicipalityCodes.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">
                  {deptMunicipalityCodes.length} municipio(s) en {selectedDeptName}
                </p>
                <button
                  type="button"
                  onClick={toggleSelectAllDept}
                  disabled={disabled}
                  className="text-xs font-semibold text-[#03548C] hover:text-[#0b1440] disabled:opacity-40 transition-colors"
                >
                  {allDeptSelected ? "Quitar todos" : `Seleccionar todos en ${selectedDeptName}`}
                </button>
              </div>
            )}

            {selectedDept && (
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-0.5 mb-3">
                {loadingMunicipalities ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Cargando municipios...</p>
                ) : filteredMunicipalities.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Sin resultados</p>
                ) : (
                  filteredMunicipalities.map((m) => (
                    <label
                      key={m.code}
                      className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={codes.includes(m.code)}
                        onChange={() => toggleMunicipality(m.code)}
                        disabled={disabled}
                        className="accent-[#03548C]"
                      />
                      {m.name}
                    </label>
                  ))
                )}
              </div>
            )}

            {chipGroups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chipGroups.map((group) => (
                  <span
                    key={group.key}
                    className="inline-flex items-center gap-1 bg-[#03548C]/10 text-[#03548C] text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {group.name}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeGroup(group)}
                        className="hover:text-[#0b1440]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rango de edad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Edad mínima
              </label>
              <input
                type="number"
                min={0}
                value={value?.minAge ?? ""}
                onChange={(e) => handleAgeChange("minAge", e.target.value)}
                disabled={disabled}
                placeholder="Sin mínimo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent transition-colors disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Edad máxima
              </label>
              <input
                type="number"
                min={0}
                value={value?.maxAge ?? ""}
                onChange={(e) => handleAgeChange("maxAge", e.target.value)}
                disabled={disabled}
                placeholder="Sin máximo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent transition-colors disabled:bg-gray-50"
              />
            </div>
          </div>
          {ageError && <p className="text-red-500 text-xs -mt-3">{ageError}</p>}

          {/* Género */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Género</label>
            <select
              value={value?.targetGender ?? ""}
              onChange={(e) =>
                emitChange({
                  targetGender: (e.target.value || undefined) as TargetGender | undefined,
                })
              }
              disabled={disabled}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent transition-colors bg-white disabled:bg-gray-50"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
