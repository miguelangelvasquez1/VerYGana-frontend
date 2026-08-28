"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  CalendarDays,
  AlertCircle,
  Megaphone,
  Palette,
  ClipboardList,
  PawPrint,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCommercialProfile } from "@/services/commercialService";
import { adService } from "@/services/adService";
import { getCampaigns } from "@/services/CampaignService";
import { surveyAdminService } from "@/services/surveyService";
import type { SurveyStatus } from "@/types/survey.types";
import { getMyPetRequests } from "@/services/PetRequestService";
import { getMyAllies } from "@/services/AlliesService";
import { CommercialProfileResponseDTO } from "@/types/Commercial.types";
import { AllyCommercialResponseDTO } from "@/types/Allies.types";
import AlliesSummarySection from "@/components/commercial/profile/AlliesSummarySection";
import { ChangePlanButton } from "@/components/commercial/planChange/planChange.shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface PremiumStats {
  activeAds: number;
  activeCampaigns: number;
  activeSurveys: number;
  approvedPetProducts: number;
}

const EMPTY_STATS: PremiumStats = {
  activeAds: 0,
  activeCampaigns: 0,
  activeSurveys: 0,
  approvedPetProducts: 0,
};

export default function CommercialProfilePremium() {
  const { user } = useAuth();
  const commercialId = Number(user?.id);

  const [profile, setProfile] = useState<CommercialProfileResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [stats, setStats] = useState<PremiumStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  const [allies, setAllies] = useState<AllyCommercialResponseDTO[]>([]);
  const [alliesLoading, setAlliesLoading] = useState(true);

  useEffect(() => {
    if (!commercialId || isNaN(commercialId)) return;
    const load = async () => {
      try {
        const data = await getCommercialProfile(commercialId);
        setProfile(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commercialId]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      const [adsRes, campaignsRes, surveysRes, petsRes] = await Promise.allSettled([
        adService.getMyAds(0, 200),
        getCampaigns(),
        surveyAdminService.getAllSurveys(0, 1, "ACTIVE" as SurveyStatus),
        getMyPetRequests(),
      ]);

      setStats({
        activeAds:
          adsRes.status === "fulfilled"
            ? adsRes.value.content.filter((a) => a.status === "ACTIVE").length
            : 0,
        activeCampaigns:
          campaignsRes.status === "fulfilled"
            ? campaignsRes.value.filter((c) => c.status === "ACTIVE").length
            : 0,
        activeSurveys:
          surveysRes.status === "fulfilled" ? surveysRes.value.meta.totalElements : 0,
        approvedPetProducts:
          petsRes.status === "fulfilled"
            ? petsRes.value.filter((r) => r.status === "APPROVED").length
            : 0,
      });
      setStatsLoading(false);
    };
    loadStats();

    const loadAllies = async () => {
      try {
        setAllies(await getMyAllies());
      } finally {
        setAlliesLoading(false);
      }
    };
    loadAllies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const location = [profile.municipalityName, profile.departmentName]
    .filter(Boolean)
    .join(", ");

  const statTiles = [
    { label: "Anuncios activos", value: stats.activeAds, icon: Megaphone, bg: "bg-blue-50", color: "text-blue-500" },
    { label: "Campañas activas", value: stats.activeCampaigns, icon: Palette, bg: "bg-purple-50", color: "text-purple-500" },
    { label: "Encuestas activas", value: stats.activeSurveys, icon: ClipboardList, bg: "bg-green-50", color: "text-green-500" },
    { label: "Productos en mascotas", value: stats.approvedPetProducts, icon: PawPrint, bg: "bg-amber-50", color: "text-amber-500" }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-14">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-2 w-full bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440]" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-md bg-linear-to-br from-[#0b1440] to-[#03548C]">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

            {/* Nombre y metadatos */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {profile.companyName}
              </h1>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                {location && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                    {location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" />
                  Miembro desde {formatDate(profile.registeredDate)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
            {statTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.label}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${tile.bg}`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${tile.color}`} />
                  <div>
                    <p className="text-xl font-extrabold text-gray-900 leading-none">
                      {statsLoading && tile.label !== "Aliados" ? "—" : tile.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{tile.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PLAN ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-700">Tu plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Cambia de plan cuando quieras. Si ya tienes una solicitud en curso, te llevaremos a su detalle.
          </p>
        </div>
        <ChangePlanButton />
      </div>

      {/* ── ALIADOS ── */}
      <AlliesSummarySection
        title="Mis aliados"
        description="Comerciales cuyos productos estás promocionando en el pop up final de tus juegos."
        allies={allies}
        loading={alliesLoading}
        emptyText="Aún no promocionas productos de ningún aliado. Ve a la sección Aliados para elegir el primero."
        linkBase="/commercial/allies"
      />
    </div>
  );
}
