import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LegalDocumentsService, LegalDocumentType } from '@/services/LegalDocumentsService';
import { getLegalDocumentHistory } from '@/services/admin/AdminLegalDocumentsService';

export const legalDocumentKeys = {
  all: ['legal-documents'] as const,
  active: () => [...legalDocumentKeys.all, 'active'] as const,
  history: (type: LegalDocumentType) => [...legalDocumentKeys.all, 'history', type] as const,
};

export function useLegalDocuments() {
  return useQuery({
    queryKey: legalDocumentKeys.active(),
    queryFn: LegalDocumentsService.getAll,
    staleTime: 60 * 1000,
  });
}

export function useLegalDocumentHistory(type: LegalDocumentType | null) {
  return useQuery({
    queryKey: legalDocumentKeys.history(type ?? ('' as LegalDocumentType)),
    queryFn: () => getLegalDocumentHistory(type as LegalDocumentType),
    enabled: !!type,
  });
}

// La publicación de una nueva versión es un flujo de 3 pasos (prepare-upload
// → PUT a R2 → confirm), no una sola mutación — se orquesta directamente en
// el componente. Esto solo centraliza la invalidación de caché posterior.
export function useInvalidateLegalDocuments() {
  const qc = useQueryClient();
  return (type: LegalDocumentType) => {
    qc.invalidateQueries({ queryKey: legalDocumentKeys.active() });
    qc.invalidateQueries({ queryKey: legalDocumentKeys.history(type) });
  };
}
