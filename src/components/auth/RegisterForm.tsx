"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { registerConsumer } from "@/services/ConsumerService";
import { registerCommercial } from "@/services/AdvertiserService";
import { Category } from "@/types/Category.types";
import { useCategories } from "@/hooks/useCategories";
import { getActiveAvatars, AvatarDTO } from "@/services/AvatarService";
import AvatarSelector from "@/components/AvatarSelector";
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';

type Role = "BENEFICIARIO" | "COMERCIANTE";

interface Municipality {
  code: string;
  name: string;
}

interface Department {
  code: string;
  name: string;
}

// Field-level error map from API
type FieldErrors = Record<string, string>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-gray-200 focus:ring-blue-400 focus:border-blue-400"
  }`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatars, setAvatars] = useState<AvatarDTO[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { categories, loading: loadingCategories } = useCategories();
  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(
    formData.departmentCode || null
  );

  // ── Load avatars ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAvatars = async () => {
      setLoadingAvatars(true);
      try {
        const data = await getActiveAvatars();
        setAvatars(data);
      } catch {
        toast.error("Error al cargar los avatares");
      } finally {
        setLoadingAvatars(false);
      }
    };
    loadAvatars();
  }, []);

  // ── Read referral code from URL ────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setRole("BENEFICIARIO");
      setFormData((prev: any) => ({ ...prev, referredByCode: ref.toUpperCase() }));
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }

    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
      // Resetear municipio al cambiar departamento
      ...(name === "departmentCode" && {
        municipalityCode: "",
        municipalityName: "",
      }),
    }));
  };

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = municipalities.find((m: Municipality) => m.code === code);

    setFormData((prev: any) => ({
      ...prev,
      municipalityCode: code,
      municipalityName: selected?.name || "",
    }));

    if (fieldErrors["municipalityName"]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n["municipalityName"]; return n; });
    }
  };

  const handleCheckboxChange = (category: Category) => {
    setFormData((prev: any) => {
      const current: Category[] = prev.categories || [];
      const isSelected = current.some((c) => c.id === category.id);
      return {
        ...prev,
        categories: isSelected
          ? current.filter((c) => c.id !== category.id)
          : [...current, category],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Client-side validations for BENEFICIARIO
    if (role === "BENEFICIARIO") {
      const clientErrors: FieldErrors = {};
      if (!formData.avatarId) clientErrors["avatarId"] = "Debes seleccionar un avatar";
      if (!formData.userName) clientErrors["userName"] = "El nombre de usuario es requerido";
      if (!formData.birthDay || !formData.birthMonth || !formData.birthYear)
        clientErrors["birthDate"] = "La fecha de nacimiento es requerida";
      if (!formData.gender) clientErrors["gender"] = "El género es requerido";

      if (formData.birthYear && formData.birthMonth && formData.birthDay) {
        const birth = new Date(
          Number(formData.birthYear),
          Number(formData.birthMonth) - 1,
          Number(formData.birthDay)
        );
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const md = today.getMonth() - birth.getMonth();
        if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 13) clientErrors["birthDate"] = "Debes tener al menos 13 años para registrarte";
      }

      if (Object.keys(clientErrors).length > 0) {
        setFieldErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let response;
      switch (role) {
        case "BENEFICIARIO":
          response = await registerConsumer({
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            name: formData.name,
            lastNames: formData.lastNames,
            municipalityCode: formData.municipalityCode,
            categories: formData.categories || [],
            avatarId: formData.avatarId,
            referredByCode: formData.referredByCode?.trim() || undefined,
            userName: formData.userName,
            birthDate: `${formData.birthYear}-${String(formData.birthMonth).padStart(2, "0")}-${String(formData.birthDay).padStart(2, "0")}`,
            gender: formData.gender,
            department: formData.departmentName,
          });
          break;
        case "COMERCIANTE":
          response = await registerCommercial({
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            name: formData.name,
            nit: formData.nit,
          });
          break;
        default:
          throw new Error("Rol no válido");
      }

      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión");
      setFormData({});
      setRole(null);
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (error: any) {
      console.error("Error en el registro:", error);

      // Parse API validation errors
      if (error.response) {
        const data = error.response.data;

        // Show field-level errors from `details`
        if (data?.details && typeof data.details === "object") {
          setFieldErrors(data.details);
          toast.error(data.message || "Verifica los campos marcados en rojo");
        } else if (error.response.status === 409) {
          toast.error("Este correo electrónico ya está registrado.");
        } else {
          toast.error(data?.message || "Error en el registro. Por favor, intenta de nuevo.");
        }
      } else if (error.request) {
        toast.error("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        toast.error("Error en el registro. Por favor, intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SCREEN 1: Role selection ──────────────────────────────────────────────
  if (!role) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h2>
          <p className="text-gray-500 text-sm">Selecciona tu tipo de usuario para comenzar</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => setRole("BENEFICIARIO")}
            className="group flex items-center gap-4 p-5 border-2 border-blue-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-200 transition">
              🛍
            </div>
            <div>
              <p className="font-bold text-gray-800">Soy Beneficiario</p>
              <p className="text-sm text-gray-500">Gana recompensas viendo anuncios</p>
            </div>
          </button>

          <button
            onClick={() => setRole("COMERCIANTE")}
            className="group flex items-center gap-4 p-5 border-2 border-purple-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-purple-200 transition">
              📢
            </div>
            <div>
              <p className="font-bold text-gray-800">Soy Comerciante</p>
              <p className="text-sm text-gray-500">Publica tus anuncios y llega a más clientes</p>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    );
  }

  // ─── SCREEN 2: Form ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {role === "BENEFICIARIO" ? "Registro de Beneficiario" : "Registro de Comerciante"}
        </h2>
        <p className="text-gray-500 text-sm">Completa todos los campos para crear tu cuenta</p>
      </div>

      {/* Global API error banner */}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" />
            </svg>
            Por favor corrige los siguientes errores:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <li key={field} className="text-xs text-red-600">{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── BENEFICIARIO ── */}
        {role === "BENEFICIARIO" && (
          <>
            {/* Personal info */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Información personal</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label="Nombre" required error={fieldErrors["name"]}>
                    <input name="name" placeholder="Tu nombre" onChange={handleChange} value={formData.name || ""} className={inputCls(!!fieldErrors["name"])} required />
                  </FieldWrapper>
                  <FieldWrapper label="Apellidos" required error={fieldErrors["lastNames"]}>
                    <input name="lastNames" placeholder="Tus apellidos" onChange={handleChange} value={formData.lastNames || ""} className={inputCls(!!fieldErrors["lastNames"])} required />
                  </FieldWrapper>
                </div>

                <FieldWrapper label="Nombre de usuario" required error={fieldErrors["userName"]}>
                  <input
                    name="userName"
                    placeholder="ej. juan_perez123"
                    onChange={handleChange}
                    value={formData.userName || ""}
                    maxLength={20}
                    className={inputCls(!!fieldErrors["userName"])}
                    required
                  />
                  <p className="text-xs text-gray-400">Solo letras, números, puntos y guion bajo. Entre 3 y 20 caracteres.</p>
                </FieldWrapper>

                {/* Birth date */}
                <FieldWrapper label="Fecha de nacimiento" required error={fieldErrors["birthDate"]}>
                  <div className="grid grid-cols-3 gap-3">
                    <select name="birthDay" onChange={handleChange} value={formData.birthDay || ""} className={inputCls(!!fieldErrors["birthDate"])}>
                      <option value="">Día</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select name="birthMonth" onChange={handleChange} value={formData.birthMonth || ""} className={inputCls(!!fieldErrors["birthDate"])}>
                      <option value="">Mes</option>
                      {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select name="birthYear" onChange={handleChange} value={formData.birthYear || ""} className={inputCls(!!fieldErrors["birthDate"])}>
                      <option value="">Año</option>
                      {Array.from({ length: new Date().getFullYear() - 1924 }, (_, i) => new Date().getFullYear() - 13 - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </FieldWrapper>

                {/* Gender */}
                <FieldWrapper label="Género" required error={fieldErrors["gender"]}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "MALE", icon: "♂", label: "Masculino" },
                      { value: "FEMALE", icon: "♀", label: "Femenino" },
                      { value: "OTHER", icon: "⚧", label: "Otro" },
                      { value: "PREFER_NOT_TO_SAY", icon: "🤐", label: "Prefiero no decir" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData((prev: any) => ({ ...prev, gender: opt.value }));
                          if (fieldErrors["gender"]) setFieldErrors((p) => { const n = { ...p }; delete n["gender"]; return n; });
                        }}
                        className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition flex flex-col items-center gap-1
                          ${formData.gender === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                      >
                        <span className="text-lg">{opt.icon}</span>
                        <span className="leading-tight text-center">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Contact */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Datos de contacto</h3>
              <div className="space-y-4">
                <FieldWrapper label="Correo electrónico" required error={fieldErrors["email"]}>
                  <input type="email" name="email" placeholder="tu@correo.com" onChange={handleChange} value={formData.email || ""} className={inputCls(!!fieldErrors["email"])} required />
                </FieldWrapper>

                <FieldWrapper label="Teléfono" required error={fieldErrors["phoneNumber"]}>
                  <input name="phoneNumber" placeholder="300 000 0000" onChange={handleChange} value={formData.phoneNumber || ""} className={inputCls(!!fieldErrors["phoneNumber"])} required />
                </FieldWrapper>

                <FieldWrapper label="Código de referido" error={fieldErrors["referredByCode"]}>
                  <input
                    name="referredByCode"
                    placeholder="Opcional"
                    onChange={handleChange}
                    value={formData.referredByCode || ""}
                    maxLength={20}
                    className={inputCls(!!fieldErrors["referredByCode"])}
                  />
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Avatar */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Avatar</h3>
              {fieldErrors["avatarId"] && (
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" /></svg>
                  {fieldErrors["avatarId"]}
                </p>
              )}
              <AvatarSelector
                avatars={avatars}
                selectedId={formData.avatarId ?? null}
                onSelect={(id) => {
                  setFormData((prev: any) => ({ ...prev, avatarId: id }));
                  if (fieldErrors["avatarId"]) setFieldErrors((p) => { const n = { ...p }; delete n["avatarId"]; return n; });
                }}
                loading={loadingAvatars}
              />
            </section>

            <hr className="border-gray-100" />

            {/* Password */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contraseña</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Contraseña" required error={fieldErrors["password"]}>
                  <input type="password" name="password" placeholder="Mínimo 8 caracteres" onChange={handleChange} value={formData.password || ""} className={inputCls(!!fieldErrors["password"])} required />
                </FieldWrapper>
                <FieldWrapper label="Confirmar contraseña" required error={fieldErrors["confirmPassword"]}>
                  <input type="password" name="confirmPassword" placeholder="Repite tu contraseña" onChange={handleChange} value={formData.confirmPassword || ""} className={inputCls(!!fieldErrors["confirmPassword"])} required />
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Location */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Ubicación</h3>
              <div className="space-y-4">
                <FieldWrapper label="Departamento" required error={fieldErrors["departmentName"]}>
                  <select
                    name="departmentCode"
                    onChange={handleChange}
                    value={formData.departmentCode || ""}
                    className={inputCls(!!fieldErrors["departmentName"])}
                    required
                    disabled={loadingDepartments}
                  >
                    <option value="">
                      {loadingDepartments ? "Cargando departamentos..." : "Selecciona tu departamento"}
                    </option>
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </FieldWrapper>

                <FieldWrapper label="Municipio" required error={fieldErrors["municipalityName"]}>
                  <select
                    name="municipalityCode"
                    onChange={handleMunicipalityChange}
                    value={formData.municipalityCode || ""}
                    className={inputCls(!!fieldErrors["municipalityName"])}
                    required
                    disabled={!formData.departmentCode || loadingMunicipalities}
                  >
                    <option value="">
                      {!formData.departmentCode
                        ? "Selecciona primero el departamento"
                        : loadingMunicipalities
                          ? "Cargando municipios..."
                          : "Selecciona tu municipio"}
                    </option>
                    
                    {municipalities?.map((m: Municipality) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Interests */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Mis intereses</h3>
              <p className="text-xs text-gray-500 mb-3">Selecciona al menos una categoría que te interese</p>
              {fieldErrors["categories"] && (
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" /></svg>
                  {fieldErrors["categories"]}
                </p>
              )}
              {loadingCategories ? (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando categorías...
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-red-500 py-4 text-center">No se pudieron cargar las categorías. Intenta recargar la página.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = formData.categories?.some((c: Category) => c.id === cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCheckboxChange(cat)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                          ${selected
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                            : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                          }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {(formData.categories?.length ?? 0) > 0 && (
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {formData.categories.length} categoría{formData.categories.length !== 1 ? "s" : ""} seleccionada{formData.categories.length !== 1 ? "s" : ""}
                </p>
              )}
            </section>
          </>
        )}

        {/* ── COMERCIANTE ── */}
        {role === "COMERCIANTE" && (
          <>
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Información del negocio</h3>
              <div className="space-y-4">
                <FieldWrapper label="Nombre o empresa" required error={fieldErrors["name"]}>
                  <input name="name" placeholder="Nombre de tu empresa o negocio" onChange={handleChange} value={formData.name || ""} className={inputCls(!!fieldErrors["name"])} required />
                </FieldWrapper>
                <FieldWrapper label="NIT" required error={fieldErrors["nit"]}>
                  <input name="nit" placeholder="900.000.000-0" onChange={handleChange} value={formData.nit || ""} className={inputCls(!!fieldErrors["nit"])} required />
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Datos de contacto</h3>
              <div className="space-y-4">
                <FieldWrapper label="Correo electrónico" required error={fieldErrors["email"]}>
                  <input type="email" name="email" placeholder="empresa@correo.com" onChange={handleChange} value={formData.email || ""} className={inputCls(!!fieldErrors["email"])} required />
                </FieldWrapper>
                <FieldWrapper label="Teléfono" required error={fieldErrors["phoneNumber"]}>
                  <input name="phoneNumber" placeholder="300 000 0000" onChange={handleChange} value={formData.phoneNumber || ""} className={inputCls(!!fieldErrors["phoneNumber"])} required />
                </FieldWrapper>
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contraseña</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Contraseña" required error={fieldErrors["password"]}>
                  <input type="password" name="password" placeholder="Mínimo 8 caracteres" onChange={handleChange} value={formData.password || ""} className={inputCls(!!fieldErrors["password"])} required />
                </FieldWrapper>
                <FieldWrapper label="Confirmar contraseña" required error={fieldErrors["confirmPassword"]}>
                  <input type="password" name="confirmPassword" placeholder="Repite tu contraseña" onChange={handleChange} value={formData.confirmPassword || ""} className={inputCls(!!fieldErrors["confirmPassword"])} required />
                </FieldWrapper>
              </div>
            </section>
          </>
        )}

        {/* Submit buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide shadow-md transition-all
              ${isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-200"
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Registrando...
              </span>
            ) : (
              "Crear cuenta"
            )}
          </button>

          <button
            type="button"
            onClick={() => { setRole(null); setFieldErrors({}); }}
            disabled={isSubmitting}
            className="w-full text-sm text-gray-400 hover:text-gray-600 hover:underline transition py-1"
          >
            ← Volver a selección de rol
          </button>
        </div>
      </form>
    </div>
  );
}