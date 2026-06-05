"use client";

import { useEffect, useState } from "react";
import { getConsumerProfile, getConsumerInitialData } from "@/services/ConsumerService";
import type { ConsumerProfileResponseDTO, ConsumerInitialDataResponseDTO } from "@/types/Consumer.types";
import { Loader2, Edit, Mail, Phone, MapPin, Building2, Shield, Key, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
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
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
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
          Icon: Key,
        },
        {
          label: "Llaves de compra",
          value: initialData.purchaseKeys,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          Icon: TrendingUp,
        },
        {
          label: "Llaves conectividad",
          value: initialData.connectivityKeys,
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
          Icon: Wallet,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar con iniciales */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold border-4 border-white/30 bg-white/20 backdrop-blur-sm shadow-lg shrink-0 select-none">
              {getInitials(profile.name, profile.lastName)}
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
                className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold transition shadow-md"
              >
                <Edit className="w-4 h-4" />
                Editar Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats de llaves */}
        {initialData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {keyCards.map(({ label, value, color, bg, border, Icon }) => (
              <div
                key={label}
                className={`bg-white rounded-2xl border ${border} shadow-sm p-5 flex items-center gap-4`}
              >
                <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
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
            <InfoRow icon={<Mail className="w-4 h-4 text-blue-600" />} bg="bg-blue-50" label="Email" value={profile.email} />
            <InfoRow icon={<Phone className="w-4 h-4 text-blue-600" />} bg="bg-blue-50" label="Teléfono" value={profile.phoneNumber} />
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Ubicación
            </h2>
            <InfoRow icon={<Building2 className="w-4 h-4 text-purple-600" />} bg="bg-purple-50" label="Departamento" value={profile.department || "—"} />
            <InfoRow icon={<MapPin className="w-4 h-4 text-purple-600" />} bg="bg-purple-50" label="Municipio" value={profile.municipalityName || "—"} />
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
              iconBg="bg-blue-600"
              title="Historial de llaves"
              description="Ver todos los movimientos"
              borderColor="border-blue-100"
              bg="bg-blue-50 hover:bg-blue-100"
              textColor="text-blue-700"
              subColor="text-blue-500"
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
