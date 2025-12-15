"use client";

import { useEffect, useState } from "react";
import { getConsumerProfile } from "@/services/ConsumerService";
import type { ConsumerProfileResponseDTO } from "@/types/Consumer.types";
import { Loader2, User, Edit } from "lucide-react";
import Link from "next/link";

export default function ConsumerProfilePage() {
  const [profile, setProfile] = useState<ConsumerProfileResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getConsumerProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-red-600">Error cargando datos.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.name} {profile.lastName}
            </h1>
            <p className="text-gray-500">ID: {profile.id}</p>
          </div>
        </div>

        {/* Datos del usuario */}
        <div className="space-y-3">
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Teléfono:</strong> {profile.phoneNumber}</p>
          <p><strong>Rol:</strong> {profile.role}</p>
          <p><strong>Estado:</strong> {profile.userState}</p>
          <p><strong>Departamento:</strong> {profile.department}</p>
          <p><strong>Municipio:</strong> {profile.municipality}</p>
        </div>

        {/* Botón Editar */}
        <div className="mt-6 text-right">
          <Link
            href="/explore/profile/edit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition"
          >
            <Edit className="w-4 h-4" />
            Editar Perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
