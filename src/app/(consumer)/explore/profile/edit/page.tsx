"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Phone,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getConsumerProfile,
  updateConsumerProfile,
} from "@/services/ConsumerService";

import type {
  ConsumerProfileResponseDTO,
  ConsumerUpdateProfileRequestDTO,
} from "@/types/Consumer.types";

const profileSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  phoneNumber: z.string().min(7, "Número muy corto").max(15, "Número muy largo"),
  department: z.string().min(2, "Departamento requerido"),
  municipality: z.string().min(2, "Municipio requerido"),
});

type ProfileForm = z.infer<typeof profileSchema>;

function getInitials(name: string, lastName: string) {
  return `${name?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

const FormField = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    icon: React.ReactNode;
    error?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, icon, error, ...props }, ref) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {icon}
      </div>
      <input
        ref={ref}
        {...props}
        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm ${
          error ? "border-red-400 focus:ring-red-400" : "border-gray-200"
        }`}
      />
    </div>
    {error && (
      <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
));
FormField.displayName = "FormField";

export default function EditConsumerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ConsumerProfileResponseDTO | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getConsumerProfile();
        setProfile(data);
        setValue("email", data.email);
        setValue("phoneNumber", data.phoneNumber);
        setValue("department", data.department);
        setValue("municipality", data.municipalityName);
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [setValue]);

  const onSubmit = async (formData: ProfileForm) => {
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(false);

    const request: ConsumerUpdateProfileRequestDTO = {
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      department: formData.department,
      municipalityName: formData.municipality,
    };

    try {
      await updateConsumerProfile(request);
      setSuccessMsg(true);
      setTimeout(() => {
        window.location.href = "/explore/profile";
      }, 1500);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setErrorMsg(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-2 text-red-500">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm font-medium">No se pudo cargar el perfil del usuario.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/explore/profile"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al perfil
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold border-4 border-white/30 bg-white/20 backdrop-blur-sm shadow-lg shrink-0 select-none">
              {getInitials(profile.name, profile.lastName)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Editar Perfil
              </h1>
              <p className="text-white/70 mt-0.5 text-sm">
                {profile.name} {profile.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banners de estado */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Perfil actualizado correctamente. Redirigiendo...
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Ocurrió un error al guardar. Intenta de nuevo.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Sección: Contacto */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Información de contacto
            </h2>
            <FormField
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label="Número de Teléfono"
              type="text"
              icon={<Phone className="w-4 h-4" />}
              error={errors.phoneNumber?.message}
              {...register("phoneNumber")}
            />
          </div>

          {/* Sección: Ubicación */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Ubicación
            </h2>
            <FormField
              label="Departamento"
              type="text"
              icon={<Building2 className="w-4 h-4" />}
              error={errors.department?.message}
              {...register("department")}
            />
            <FormField
              label="Municipio"
              type="text"
              icon={<MapPin className="w-4 h-4" />}
              error={errors.municipality?.message}
              {...register("municipality")}
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/explore/profile"
              className="flex-1 flex justify-center items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-3 rounded-xl font-semibold transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-semibold transition text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
