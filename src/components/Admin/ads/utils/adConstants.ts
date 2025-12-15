import { 
  Eye, AlertCircle, CheckCircle, 
  Play, Pause, XCircle, Ban 
} from 'lucide-react';

export const AD_STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  PAUSED: 'bg-gray-100 text-gray-800 border-gray-200',
  BLOCKED: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const AD_STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  BLOCKED: 'Bloqueado',
  COMPLETED: 'Completado',
  REJECTED: 'Rechazado',
} as const;

export const STAT_CARDS_CONFIG = [
  { key: 'total', label: 'Total', color: 'gray', icon: Eye },
  { key: 'pending', label: 'Pendientes', color: 'yellow', icon: AlertCircle },
  { key: 'approved', label: 'Aprobados', color: 'green', icon: CheckCircle },
  { key: 'active', label: 'Activos', color: 'blue', icon: Play },
  { key: 'paused', label: 'Pausados', color: 'gray', icon: Pause },
  { key: 'blocked', label: 'Bloqueados', color: 'orange', icon: Ban },
  { key: 'rejected', label: 'Rechazados', color: 'red', icon: XCircle },
  { key: 'completed', label: 'Completados', color: 'purple', icon: CheckCircle },
] as const;

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'blocked', label: 'Bloqueados' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
] as const;