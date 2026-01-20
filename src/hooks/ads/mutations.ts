import { adService } from "@/services/adService";
import { adKeys } from "./adKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAdKeys } from "./adminQuerys";
import { AdForAdminDTO, AdForConsumerDTO, AdResponseDTO } from "@/types/ads/advertiser";

// Helper para actualizar listas en caché
const updateAdInLists = (
  queryClient: any,
  updatedAd: AdResponseDTO | AdForAdminDTO,
  queryKeys: any[]
) => {
  queryKeys.forEach(queryKey => {
    queryClient.setQueriesData(
      { queryKey },
      (oldData: any) => {
        if (!oldData?.content) return oldData;
        return {
          ...oldData,
          content: oldData.content.map((ad: any) =>
            ad.id === updatedAd.id ? updatedAd : ad
          ),
        };
      }
    );
  });
};

// Hook para crear anuncio
export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => adService.createAd(formData),
    onSuccess: () => {
      // Invalida todas las listas de anuncios para que se recarguen
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
    },
  });
}

// Actualizar anuncio (Manual cache update, post-success)
export function useUpdateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      adService.updateAd(id, formData),
    
    onSuccess: (updatedAd) => {
      // Actualizar detalle
      queryClient.setQueryData(adKeys.detail(updatedAd.id), updatedAd);
      
      // Actualizar en todas las listas
      updateAdInLists(queryClient, updatedAd, [
        adKeys.lists(),
        adminAdKeys.lists()
      ]);
    },
  });
}

// Pausar (Simple)
export function usePauseAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adService.pauseAd(id),
    onSuccess: (updatedAd) => {
      queryClient.setQueryData(adKeys.detail(updatedAd.id), updatedAd);
      updateAdInLists(queryClient, updatedAd, [
        adKeys.lists(),
        adminAdKeys.lists()
      ]);
    },
  });
}

// Aprobar anuncio (Híbrido), (admin)
export function useApproveAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adId: number) => adService.approveAd(adId),
    
    onSuccess: (updatedAd) => {
      // Actualizar caché
      queryClient.setQueryData(adKeys.detail(updatedAd.id), updatedAd);
      updateAdInLists(queryClient, updatedAd, [
        adKeys.lists(),
        adminAdKeys.lists()
      ]);

      // Invalidar solo pendientes (porque ya no está ahí)
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'admin' && 
          query.queryKey[1] === 'ads' && 
          query.queryKey[2] === 'pending'
      });
    },
  });
}

// Rechazar anuncio (Admin)
export function useRejectAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adService.rejectAd(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAdKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
    },
  });
}

// Hook para reanudar anuncio
export function useResumeAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adService.resumeAd(id),
    onSuccess: (updatedAd) => {
      queryClient.setQueryData(adKeys.detail(updatedAd.id), updatedAd);
      updateAdInLists(queryClient, updatedAd, [
        adKeys.lists(),
        adminAdKeys.lists()
      ]);
    },
  });
}

// Hook para bloqeuar anuncio
export function useBlockAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adService.blockAd(id),

    onSuccess: (updatedAd) => {
      // 1️⃣ Actualizar el detalle
      queryClient.setQueryData(
        adKeys.detail(updatedAd.id),
        updatedAd
      );

      // 2️⃣ Actualizar el anuncio en todas las listas conocidas
      updateAdInLists(queryClient, updatedAd, [
        adKeys.lists(),
        adminAdKeys.lists(),
      ]);

      // 3️⃣ Invalidar SOLO listas donde ya no debería aparecer
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'admin' &&
          query.queryKey[1] === 'ads' &&
          (
            query.queryKey[2] === 'pending' ||
            query.queryKey[2] === 'active'
          ),
      });
    },
  });
}

// Hook para eliminar anuncio
export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adService.deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
    },
  });
}

// hook para obtener siguiente anuncio
export function useNextAd() {
  return useMutation<AdForConsumerDTO | null>({
    mutationFn: () => adService.getNextAd()
  })
}


// Hook para registrar like en anuncio
export function useLikeAd() {
  return useMutation({
    mutationFn: ({
      adId,
      sessionUUID
    }: {
      adId: number
      sessionUUID: string
    }) => adService.likeAd(adId, sessionUUID)
  })
}