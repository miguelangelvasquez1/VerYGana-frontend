import {
  Role,
  UserState,
  UserLevel,
  Gender,
  DocumentType,
  IncomeRange,
  AnnualRevenueRange,
  UserSummaryResponseDTO,
  ConsumerSummaryResponseDTO,
  AdminSummaryResponseDTO,
  CommercialSummaryResponseDTO,
  GameDesignerSummaryResponseDTO,
  ComplianceOfficerSummaryResponseDTO,
} from '@/types/User.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';

export type TabKey =
  | Role.CONSUMER
  | Role.COMMERCIAL
  | Role.ADMIN
  | Role.GAME_DESIGNER
  | Role.COMPLIANCE_OFFICER
  | 'RECENT';

export type AnyUserRow =
  | ConsumerSummaryResponseDTO
  | CommercialSummaryResponseDTO
  | AdminSummaryResponseDTO
  | GameDesignerSummaryResponseDTO
  | ComplianceOfficerSummaryResponseDTO
  | UserSummaryResponseDTO;

export const roleLabel: Record<Role, string> = {
  [Role.CONSUMER]: 'Consumidor',
  [Role.COMMERCIAL]: 'Comercial',
  [Role.ADMIN]: 'Administrador',
  [Role.GAME_DESIGNER]: 'Game Designer',
  [Role.COMPLIANCE_OFFICER]: 'Oficial de Cumplimiento',
};

export const roleBadgeColor: Record<Role, string> = {
  [Role.CONSUMER]: 'bg-admin-blue/10 text-admin-blue',
  [Role.COMMERCIAL]: 'bg-admin-gold/10 text-admin-gold',
  [Role.ADMIN]: 'bg-admin-navy/10 text-admin-navy',
  [Role.GAME_DESIGNER]: 'bg-purple-100 text-purple-700',
  [Role.COMPLIANCE_OFFICER]: 'bg-teal-100 text-teal-700',
};

export const userStateLabel: Record<UserState, string> = {
  [UserState.PENDING_EMAIL]: 'Pendiente de email',
  [UserState.PENDING_KYC_REVIEW]: 'Pendiente de revisión',
  [UserState.ACTIVE]: 'Activo',
  [UserState.BLOCKED]: 'Bloqueado',
};

export const userStateColor: Record<UserState, string> = {
  [UserState.ACTIVE]: 'bg-green-100 text-green-800',
  [UserState.BLOCKED]: 'bg-red-100 text-red-800',
  [UserState.PENDING_EMAIL]: 'bg-amber-100 text-amber-800',
  [UserState.PENDING_KYC_REVIEW]: 'bg-purple-100 text-purple-800',
};

export const levelLabel: Record<UserLevel, string> = {
  [UserLevel.BRONCE]: 'Bronce',
  [UserLevel.PLATA]: 'Plata',
  [UserLevel.ORO]: 'Oro',
  [UserLevel.RUBI]: 'Rubí',
  [UserLevel.ESMERALDA]: 'Esmeralda',
  [UserLevel.DIAMANTE]: 'Diamante',
};

export const planLabel: Record<PlanCode, string> = {
  [PlanCode.BASIC]: 'Básico',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]: 'Premium',
};

export const planBadgeColor: Record<PlanCode, string> = {
  [PlanCode.BASIC]: 'bg-gray-100 text-gray-700',
  [PlanCode.STANDARD]: 'bg-admin-blue/10 text-admin-blue',
  [PlanCode.PREMIUM]: 'bg-admin-gold/10 text-admin-gold',
};

export const genderLabel: Record<Gender, string> = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Femenino',
  [Gender.OTHER]: 'Otro',
  [Gender.PREFER_NOT_TO_SAY]: 'Prefiere no decirlo',
};

export const documentTypeLabel: Record<DocumentType, string> = {
  [DocumentType.CC]: 'Cédula de ciudadanía',
  [DocumentType.CE]: 'Cédula de extranjería',
  [DocumentType.PP]: 'Pasaporte',
};

export const incomeRangeLabel: Record<IncomeRange, string> = {
  [IncomeRange.LESS_THAN_1_SMMLV]: 'Menos de 1 SMMLV',
  [IncomeRange.FROM_1_TO_3_SMMLV]: 'Entre 1 y 3 SMMLV',
  [IncomeRange.FROM_3_TO_10_SMMLV]: 'Entre 3 y 10 SMMLV',
  [IncomeRange.MORE_THAN_10_SMMLV]: 'Más de 10 SMMLV',
};

export const annualRevenueRangeLabel: Record<AnnualRevenueRange, string> = {
  [AnnualRevenueRange.LESS_THAN_500_SMMLV]: 'Menos de 500 SMMLV',
  [AnnualRevenueRange.FROM_500_SMMLV_TO_5000_SMMLV]: 'Entre 500 y 5.000 SMMLV',
  [AnnualRevenueRange.FROM_5000_TO_50000_SMMLV]: 'Entre 5.000 y 50.000 SMMLV',
  [AnnualRevenueRange.MORE_THAN_50000_SMMLV]: 'Más de 50.000 SMMLV',
};

export const formatDate = (value?: string | null): string => {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatCOP = (cents?: number | null): string => {
  if (cents === null || cents === undefined) return '—';
  return `$${(cents / 100).toLocaleString('es-CO')}`;
};

export const formatKeys = (cents?: number | null): string => {
  if (cents === null || cents === undefined) return '—';
  return `${(cents / 1000).toLocaleString('es-CO', { maximumFractionDigits: 3 })} llaves`;
};

/** Rol efectivo de una fila: en la pestaña "Recientes" el rol viene en cada item, en las demás lo define la pestaña activa. */
export const getRowRole = (row: AnyUserRow, tab: TabKey): Role =>
  tab === 'RECENT' ? row.role : (tab as Role);

export const getRowTitle = (row: AnyUserRow, tab: TabKey): string => {
  if (tab === 'RECENT') return row.email || 'Sin email';

  const fallback = row.email || 'Usuario sin datos';

  switch (tab) {
    case Role.CONSUMER: {
      const r = row as ConsumerSummaryResponseDTO;
      const full = `${r.name ?? ''} ${r.lastName ?? ''}`.trim();
      return full || fallback;
    }
    case Role.COMMERCIAL:
      return (row as CommercialSummaryResponseDTO).companyName || fallback;
    case Role.ADMIN: {
      const code = (row as AdminSummaryResponseDTO).adminCode;
      return code ? `Admin ${code}` : fallback;
    }
    case Role.GAME_DESIGNER: {
      const r = row as GameDesignerSummaryResponseDTO;
      const full = `${r.name ?? ''} ${r.lastName ?? ''}`.trim();
      return full || fallback;
    }
    case Role.COMPLIANCE_OFFICER: {
      const r = row as ComplianceOfficerSummaryResponseDTO;
      const full = `${r.name ?? ''} ${r.lastName ?? ''}`.trim();
      return full || fallback;
    }
    default:
      return fallback;
  }
};
