import type { PetRequestStatus } from '@/services/PetRequestService';

/** Etiquetas y color de cada estado — compartidas por la lista y el detalle. */
export const PET_STATUS_CONFIG: Record<PetRequestStatus, { label: string; className: string }> = {
  PENDING:          { label: 'Pendiente',    className: 'bg-yellow-100 text-yellow-800' },
  IN_REVIEW:        { label: 'En revisión',  className: 'bg-blue-100 text-blue-800'     },
  APPROVED:         { label: 'Aprobada',     className: 'bg-indigo-100 text-indigo-800' },
  ITEM_IN_PROGRESS: { label: 'En diseño',    className: 'bg-purple-100 text-purple-800' },
  COMPLETED:        { label: 'En el juego',  className: 'bg-emerald-100 text-emerald-800' },
  REJECTED:         { label: 'Rechazada',    className: 'bg-red-100 text-red-800'       },
};

export const PET_STATUS_FILTERS: { label: string; value: PetRequestStatus | 'ALL' }[] = [
  { label: 'Todas',       value: 'ALL' },
  { label: 'Pendientes',  value: 'PENDING' },
  { label: 'En revisión', value: 'IN_REVIEW' },
  { label: 'Aprobadas',   value: 'APPROVED' },
  { label: 'En diseño',   value: 'ITEM_IN_PROGRESS' },
  { label: 'En el juego', value: 'COMPLETED' },
  { label: 'Rechazadas',  value: 'REJECTED' },
];

export const formatPetDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export const designerLabel = (d: { name: string; lastName?: string; designerCode?: string }) =>
  [`${d.name}${d.lastName ? ` ${d.lastName}` : ''}`, d.designerCode && `· ${d.designerCode}`]
    .filter(Boolean)
    .join(' ');
