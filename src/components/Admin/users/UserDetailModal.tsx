'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Pencil, Send, Ban, Unlock, PawPrint } from 'lucide-react';
import { Role, UserState, ConsumerResponseDTO, AdminResponseDTO, CommercialResponseDTO, GameDesignerResponseDTO, ComplianceOfficerResponseDTO } from '@/types/User.types';
import {
  getConsumer,
  getAdmin,
  getCommercial,
  getGameDesigner,
  getComplianceOfficer,
} from '@/services/admin/AdminUserService';
import {
  roleLabel,
  roleBadgeColor,
  userStateLabel,
  userStateColor,
  genderLabel,
  documentTypeLabel,
  incomeRangeLabel,
  annualRevenueRangeLabel,
  formatDate,
  formatCOP,
  formatKeys,
} from './userMeta';

type DetailDTO =
  | ConsumerResponseDTO
  | AdminResponseDTO
  | CommercialResponseDTO
  | GameDesignerResponseDTO
  | ComplianceOfficerResponseDTO;

interface Props {
  isOpen: boolean;
  role: Role;
  publicId: string;
  onClose: () => void;
  onEdit: () => void;
  onNotify: () => void;
  onToggleBlock: () => void;
}

const fetchDetailByRole = (role: Role, publicId: string): Promise<DetailDTO> => {
  switch (role) {
    case Role.CONSUMER:
      return getConsumer(publicId);
    case Role.ADMIN:
      return getAdmin(publicId);
    case Role.COMMERCIAL:
      return getCommercial(publicId);
    case Role.GAME_DESIGNER:
      return getGameDesigner(publicId);
    case Role.COMPLIANCE_OFFICER:
      return getComplianceOfficer(publicId);
  }
};

const getDetailTitle = (role: Role, data: DetailDTO): string => {
  const fallback = data.email || 'Usuario sin datos';
  switch (role) {
    case Role.CONSUMER: {
      const full = `${(data as ConsumerResponseDTO).name ?? ''} ${(data as ConsumerResponseDTO).lastName ?? ''}`.trim();
      return full || fallback;
    }
    case Role.ADMIN: {
      const code = (data as AdminResponseDTO).adminCode;
      return code ? `Admin ${code}` : fallback;
    }
    case Role.COMMERCIAL:
      return (data as CommercialResponseDTO).companyName || fallback;
    case Role.GAME_DESIGNER: {
      const full = `${(data as GameDesignerResponseDTO).name ?? ''} ${(data as GameDesignerResponseDTO).lastName ?? ''}`.trim();
      return full || fallback;
    }
    case Role.COMPLIANCE_OFFICER: {
      const full = `${(data as ComplianceOfficerResponseDTO).name ?? ''} ${(data as ComplianceOfficerResponseDTO).lastName ?? ''}`.trim();
      return full || fallback;
    }
  }
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-900 mt-0.5">{value ?? '—'}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">{title}</h3>
    <div className="grid grid-cols-2 gap-4">{children}</div>
  </div>
);

const UserDetailModal: React.FC<Props> = ({ isOpen, role, publicId, onClose, onEdit, onNotify, onToggleBlock }) => {
  const [data, setData] = useState<DetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setData(null);
    setError(null);
    setLoading(true);
    fetchDetailByRole(role, publicId)
      .then(setData)
      .catch(() => setError('No se pudo cargar el detalle del usuario'))
      .finally(() => setLoading(false));
  }, [isOpen, role, publicId]);

  if (!isOpen) return null;

  const isBlocked = data?.userState === UserState.BLOCKED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {data ? getDetailTitle(role, data) : 'Detalle del usuario'}
              </h2>
              {data && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleBadgeColor[role]}`}>
                  {roleLabel[role]}
                </span>
              )}
              {data && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${userStateColor[data.userState]}`}>
                  {userStateLabel[data.userState]}
                </span>
              )}
            </div>
            {data && <p className="text-sm text-gray-500 mt-0.5">{data.email}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-admin-blue" size={32} />
          </div>
        ) : error || !data ? (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            <Section title="Información de cuenta">
              <InfoRow label="Teléfono" value={data.phoneNumber} />
              <InfoRow label="Registrado el" value={formatDate(data.registeredDate)} />
              <InfoRow label="Intentos fallidos de login" value={data.failedLoginAttempts} />
              <InfoRow label="Cuenta bloqueada desde" value={data.accountLockedAt ? formatDate(data.accountLockedAt) : 'No bloqueada'} />
            </Section>

            {role === Role.CONSUMER && (() => {
              const c = data as ConsumerResponseDTO;
              return (
                <>
                  <Section title="Perfil del consumidor">
                    <InfoRow label="Usuario" value={c.userName} />
                    <InfoRow label="Documento" value={`${documentTypeLabel[c.documentType]} ${c.documentNumber}`} />
                    <InfoRow label="Edad" value={c.age} />
                    <InfoRow label="Género" value={genderLabel[c.gender]} />
                    <InfoRow label="Ubicación" value={`${c.municipalityName}, ${c.departmentName}`} />
                    <InfoRow label="Ocupación" value={c.occupation} />
                    <InfoRow label="Rango de ingresos" value={incomeRangeLabel[c.monthlyIncomeRange]} />
                    <InfoRow label="Persona expuesta políticamente" value={c.pep ? 'Sí' : 'No'} />
                    <InfoRow label="Tiene mascota" value={<span className="flex items-center gap-1">{c.hasPet ? 'Sí' : 'No'} {c.hasPet && <PawPrint size={14} className="text-admin-gold" />}</span>} />
                    <InfoRow label="Código de referido" value={c.referralCode} />
                    <InfoRow label="Referido por" value={c.referredBy ?? 'Registro directo'} />
                    <InfoRow label="Último login diario" value={formatDate(c.lastDailyLoginDate)} />
                    <InfoRow label="Anuncios vistos" value={c.adsWatched} />
                  </Section>

                  <Section title="Billetera de llaves">
                    <InfoRow label="Llaves de compra" value={formatKeys(c.keyWallet?.purchaseKeysCents)} />
                    <InfoRow label="Llaves de compra bloqueadas" value={formatKeys(c.keyWallet?.blockedPurchaseKeysCents)} />
                    <InfoRow label="Llaves de conectividad" value={formatKeys(c.keyWallet?.connectivityKeysCents)} />
                    <InfoRow label="Llaves de conectividad bloqueadas" value={formatKeys(c.keyWallet?.blockedConnectivityKeysCents)} />
                  </Section>
                </>
              );
            })()}

            {role === Role.COMMERCIAL && (() => {
              const co = data as CommercialResponseDTO;
              return (
                <>
                  <Section title="Perfil comercial">
                    <InfoRow label="NIT" value={co.nit} />
                    <InfoRow label="Código CIIU" value={co.ciiuCode} />
                    <InfoRow label="Registro mercantil" value={co.mercantileRegistration || 'No registrado'} />
                    <InfoRow label="Representante legal" value={`${documentTypeLabel[co.legalRepDocType]} ${co.legalRepDocNumber}`} />
                    <InfoRow label="Persona expuesta políticamente" value={co.pep ? 'Sí' : 'No'} />
                    <InfoRow label="Ingresos anuales" value={annualRevenueRangeLabel[co.annualIncomeRange]} />
                    <InfoRow label="Ubicación" value={`${co.municipalityName}, ${co.departmentName}`} />
                  </Section>
                  <Section title="Plan actual">
                    <InfoRow label="Plan" value={co.currentPlan?.planName ?? 'Sin plan activo'} />
                    <InfoRow label="Cuota mensual" value={formatCOP(co.currentPlan?.monthlyFeeCents)} />
                    <InfoRow label="Comisión por venta" value={co.currentPlan ? `${co.currentPlan.saleCommissionPct}%` : '—'} />
                    <InfoRow label="Aceptado" value={co.currentPlan?.accepted ? `Sí, el ${formatDate(co.currentPlan.acceptedAt)}` : 'No'} />
                  </Section>
                </>
              );
            })()}

            {role === Role.ADMIN && (
              <Section title="Perfil administrativo">
                <InfoRow label="Código de administrador" value={(data as AdminResponseDTO).adminCode} />
              </Section>
            )}

            {role === Role.GAME_DESIGNER && (() => {
              const g = data as GameDesignerResponseDTO;
              return (
                <Section title="Perfil de Game Designer">
                  <InfoRow label="Código de diseñador" value={g.designerCode} />
                  <InfoRow label="Campañas diseñadas" value={g.campaignsDesigned} />
                  <InfoRow label="Vinculado desde" value={formatDate(g.joinedAt)} />
                  <InfoRow label="Bio" value={g.bio || 'Sin biografía'} />
                </Section>
              );
            })()}

            {role === Role.COMPLIANCE_OFFICER && (
              <Section title="Perfil de cumplimiento">
                <InfoRow label="Número de placa" value={(data as ComplianceOfficerResponseDTO).badgeNumber} />
              </Section>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-admin-midnight bg-admin-midnight/10 rounded-lg hover:bg-admin-midnight/20 transition-colors cursor-pointer"
              >
                <Pencil size={16} /> Editar datos
              </button>
              <button
                onClick={onNotify}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-admin-blue bg-admin-blue/10 rounded-lg hover:bg-admin-blue/20 transition-colors cursor-pointer"
              >
                <Send size={16} /> Enviar notificación
              </button>
              <button
                onClick={onToggleBlock}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  isBlocked ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-red-700 bg-red-100 hover:bg-red-200'
                }`}
              >
                {isBlocked ? <Unlock size={16} /> : <Ban size={16} />}
                {isBlocked ? 'Reactivar' : 'Bloquear'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
