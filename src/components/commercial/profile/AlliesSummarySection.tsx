"use client";

import { useRouter } from "next/navigation";
import { Handshake, Building2, ChevronRight } from "lucide-react";
import { AllyCommercialResponseDTO } from "@/types/Allies.types";

const PLAN_LABELS: Record<string, string> = {
  BASIC: "Básico",
  STANDARD: "Estándar",
  PREMIUM: "Premium",
};

interface AlliesSummarySectionProps {
  title: string;
  description: string;
  allies: AllyCommercialResponseDTO[];
  loading: boolean;
  emptyText: string;
  /** Si se pasa, cada aliado navega a `${linkBase}/{commercialId}` (storefront dentro del panel). */
  linkBase?: string;
}

export default function AlliesSummarySection({
  title,
  description,
  allies,
  loading,
  emptyText,
  linkBase,
}: AlliesSummarySectionProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Handshake className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">{description}</p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#03548C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allies.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">{emptyText}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {allies.map((ally) => {
            const clickable = Boolean(linkBase);
            return (
              <div
                key={ally.commercialId}
                onClick={clickable ? () => router.push(`${linkBase}/${ally.commercialId}`) : undefined}
                className={`flex items-center gap-3 py-3 ${
                  clickable ? "cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#03548C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{ally.companyName}</p>
                  <p className="text-xs text-gray-400">
                    Plan {PLAN_LABELS[ally.planCode] ?? ally.planCode}
                  </p>
                </div>
                {clickable && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
