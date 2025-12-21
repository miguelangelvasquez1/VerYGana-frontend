"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import {
  getConsumerProfile,
  updateConsumerProfile,
} from "@/services/ConsumerService";

import type {
  ConsumerProfileResponseDTO,
  ConsumerUpdateProfileRequestDTO,
} from "@/types/Consumer.types";
import Footer from "@/components/Footer";
import Navbar from "@/components/bars/NavBar";

// ----------------------------
// VALIDATION SCHEMA (Zod)
// ----------------------------
const profileSchema = z.object({
  email: z.string().email("Email inválido"),
  phoneNumber: z
    .string()
    .min(7, "Número muy corto")
    .max(15, "Número muy largo"),
  department: z.string().min(2, "Departamento requerido"),
  municipality: z.string().min(2, "Municipio requerido"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditConsumerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ConsumerProfileResponseDTO | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // ----------------------------
  // LOAD INITIAL PROFILE DATA
  // ----------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getConsumerProfile();
        setProfile(data);

        // Prefill form
        setValue("email", data.email);
        setValue("phoneNumber", data.phoneNumber);
        setValue("department", data.department);
        setValue("municipality", data.municipality);
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [setValue]);

  // ----------------------------
  // HANDLE FORM SUBMIT
  // ----------------------------
  const onSubmit = async (formData: ProfileForm) => {
    setSaving(true);

    const request: ConsumerUpdateProfileRequestDTO = {
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      department: formData.department,
      municipality: formData.municipality,
    };

    try {
      await updateConsumerProfile(request);

      // Si usas sonner:
      // toast.success("Perfil actualizado correctamente");

      alert("Perfil actualizado correctamente");

      window.location.href = "/explore/profile";
    } catch (error) {
      console.error("Error actualizando perfil:", error);

      alert("Ocurrió un error al guardar el perfil");
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
      <p className="text-center text-red-600">
        No se pudo cargar el perfil del usuario.
      </p>
    );
  }

  // ----------------------------
  // RENDER PAGE
  // ----------------------------
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Back Button */}
        <Link
          href="/explore/profile"
          className="flex items-center text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al perfil
        </Link>

        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Editar Información Personal
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Teléfono
              </label>
              <input
                type="text"
                {...register("phoneNumber")}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                {...register("department")}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.department && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Municipality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio
              </label>
              <input
                type="text"
                {...register("municipality")}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.municipality && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.municipality.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Guardar Cambios
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
