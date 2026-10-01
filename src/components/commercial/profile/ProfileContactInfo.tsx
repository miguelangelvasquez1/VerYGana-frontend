"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, UserRound, MessageCircle, Pencil, Hash, FileText } from "lucide-react";
import {
  ProfileService,
  CommercialProfileSettingsResponseDTO,
} from "@/services/commercial/ProfileService";

function InfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5 break-words">
          {value}
          {detail && <span className="ml-2 text-xs font-normal text-gray-400">{detail}</span>}
        </p>
      </div>
    </div>
  );
}

// Oculta el número de documento salvo los últimos 4 caracteres. Si tiene 4 o
// menos no se muestra ninguno, para no exponerlo completo.
function maskDocNumber(docNumber: string): string {
  const trimmed = docNumber.trim();
  return `••••${trimmed.length > 4 ? trimmed.slice(-4) : ""}`;
}

/**
 * Muestra estática de los datos de contacto/legales del comercial
 * (GET /commercials/profile). Se usa tanto en el perfil Seller como Premium
 * para no duplicar el fetch; la edición vive en /commercial/profile/edit.
 */
export default function ProfileContactInfo() {
  const [settings, setSettings] = useState<CommercialProfileSettingsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await ProfileService.getProfile();
        if (active) setSettings(data);
      } catch {
        // silencioso: esta sección no bloquea el resto del perfil
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const legalRepName =
    settings && (settings.legalRepFirstName || settings.legalRepLastName)
      ? `${settings.legalRepFirstName ?? ""} ${settings.legalRepLastName ?? ""}`.trim()
      : "No registrado";

  const legalRepDoc =
    settings?.legalRepDocType && settings.legalRepDocNumber
      ? `${settings.legalRepDocType} ${maskDocNumber(settings.legalRepDocNumber)}`
      : undefined;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Datos de contacto</h2>
        <Link
          href="/commercial/profile/edit"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#03548C] hover:text-[#0b1440] transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar perfil
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-[#03548C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !settings ? (
        <p className="text-sm text-gray-400">No se pudo cargar la información de contacto.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={<Hash className="w-4 h-4" />} label="NIT" value={settings.nit} />
          {settings.mercantileRegistration && (
            <InfoRow
              icon={<FileText className="w-4 h-4" />}
              label="Matrícula mercantil"
              value={settings.mercantileRegistration}
            />
          )}
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={settings.email} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfono" value={settings.phoneNumber} />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Dirección"
            value={settings.address || "No registrada"}
          />
          <InfoRow
            icon={<UserRound className="w-4 h-4" />}
            label="Representante legal"
            value={legalRepName}
            detail={legalRepDoc}
          />
          <InfoRow
            icon={<MessageCircle className="w-4 h-4" />}
            label="WhatsApp"
            value={settings.whatsappAvailable ? settings.whatsappNumber || "Disponible" : "No disponible"}
          />
        </div>
      )}
    </div>
  );
}
