"use client";

import { useEffect, useState } from "react";
import { getConsumerProfile, getConsumerInitialData } from "@/services/ConsumerService";
import type { ConsumerProfileResponseDTO, ConsumerInitialDataResponseDTO } from "@/types/Consumer.types";
import { Loader2, Edit, Mail, Phone, MapPin, Building2, Shield, Key, AlertTriangle } from "lucide-react";
import Link from "next/link";

function getInitials(name: string, lastName: string) {
  return `${name?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

function StatusBadge({ state }: { state: string }) {
  const isActive = state === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
      {isActive ? "Activo" : state}
    </span>
  );
}

export default function ConsumerProfilePage() {
  const [profile, setProfile] = useState<ConsumerProfileResponseDTO | null>(null);
  const [initialData, setInitialData] = useState<ConsumerInitialDataResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileData, initData] = await Promise.all([
          getConsumerProfile(),
          getConsumerInitialData(),
        ]);
        setProfile(profileData);
        setInitialData(initData);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="animate-spin w-8 h-8 text-[#03548C]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-2 text-red-500">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm font-medium">Error cargando el perfil. Intenta de nuevo.</p>
      </div>
    );
  }

  const keyCards = initialData
    ? [
        {
          label: "Llaves disponibles",
          value: initialData.totalAvailableKeys,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
        },
        {
          label: "Llaves de compra",
          value: initialData.purchaseKeys,
          color: "text-[#03548C]",
          bg: "bg-[#03548C]/10",
          border: "border-[#03548C]/30",
        },
        {
          label: "Llaves conectividad",
          value: initialData.connectivityKeys,
          color: "text-[#00a4ff]",
          bg: "bg-[#00a4ff]/10",
          border: "border-[#00a4ff]/30",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg shrink-0 overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {initialData?.avatarUrl ? (
                <img
                  src={initialData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold select-none">
                  {getInitials(profile.name, profile.lastName)}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {profile.name} {profile.lastName}
              </h1>
              <p className="text-white/70 mt-1 text-sm">ID #{profile.id}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <StatusBadge state={profile.userState} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  <Shield className="w-3 h-3" />
                  {profile.role === "CONSUMER" ? "Beneficiario" : profile.role}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/explore/profile/edit"
                className="inline-flex items-center gap-2 bg-white text-[#03548C] hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold transition shadow-md"
              >
                <Edit className="w-4 h-4" />
                Editar Perfil
              </Link>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 lg:pb-8 space-y-6">

        {/* Stats de llaves */}
        {initialData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {keyCards.map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                className={`bg-white rounded-2xl border ${border} shadow-sm p-5 flex items-center gap-4`}
              >
                <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shrink-0`}>
                  <img src="/logos/llave.png" alt="llave" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString("es-CO")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contacto */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Información de contacto
            </h2>
            <InfoRow icon={<Mail className="w-4 h-4 text-[#03548C]" />} bg="bg-[#03548C]/10" label="Email" value={profile.email} />
            <InfoRow icon={<Phone className="w-4 h-4 text-[#03548C]" />} bg="bg-[#03548C]/10" label="Teléfono" value={profile.phoneNumber} />
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Ubicación
            </h2>
            <InfoRow icon={<Building2 className="w-4 h-4 text-[#00a4ff]" />} bg="bg-[#00a4ff]/10" label="Departamento" value={profile.department || "—"} />
            <InfoRow icon={<MapPin className="w-4 h-4 text-[#00a4ff]" />} bg="bg-[#00a4ff]/10" label="Municipio" value={profile.municipalityName || "—"} />
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink
              href="/explore/wallet"
              icon={<Key className="w-5 h-5 text-white" />}
              iconBg="bg-[#03548C]"
              title="Historial de llaves"
              description="Ver todos los movimientos"
              borderColor="border-[#03548C]/20"
              bg="bg-[#03548C]/5 hover:bg-[#03548C]/10"
              textColor="text-[#03548C]"
              subColor="text-[#00a4ff]"
            />
            <QuickLink
              href="/explore/profile/edit"
              icon={<Edit className="w-5 h-5 text-white" />}
              iconBg="bg-gray-700"
              title="Editar perfil"
              description="Actualizar información personal"
              borderColor="border-gray-200"
              bg="bg-gray-50 hover:bg-gray-100"
              textColor="text-gray-700"
              subColor="text-gray-500"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  iconBg,
  title,
  description,
  borderColor,
  bg,
  textColor,
  subColor,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  borderColor: string;
  bg: string;
  textColor: string;
  subColor: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-xl border ${borderColor} ${bg} transition group`}
    >
      <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${textColor} group-hover:underline`}>{title}</p>
        <p className={`text-xs ${subColor}`}>{description}</p>
      </div>
    </Link>
  );
}
