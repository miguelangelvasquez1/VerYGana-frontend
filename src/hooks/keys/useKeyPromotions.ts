'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getActiveKeyPromotions } from '@/services/KeyPromotionService';
import * as CommercialOffers from '@/services/commercial/KeyPromotionOffersService';
import * as AdminKeyPromotions from '@/services/admin/AdminKeyPromotionService';
import { purchaseService } from '@/services/PurchaseService';
import { useAuth } from '@/hooks/useAuth';
import type { ActiveKeyPromotionDTO } from '@/types/keys/KeyPromotion.types';
import type { CreatePurchaseItemRequestDTO } from '@/types/purchases/purchaseItem.types';

// Llaves Promocionales (MP-12).
export const keyPromotionKeys = {
  active: ['key-promotions', 'active'] as const,
  quote: (items: CreatePurchaseItemRequestDTO[]) => ['purchases', 'quote', items] as const,
  offers: ['commercial', 'key-promotions', 'offers'] as const,
  admin: ['admin', 'key-promotions'] as const,
  adminList: (page: number, size: number) => ['admin', 'key-promotions', 'list', page, size] as const,
  adminDetail: (id: number) => ['admin', 'key-promotions', 'detail', id] as const,
};

export const KEY_PROMOTIONS_PAGE_SIZE = 20;

// ─── Consumidor ──────────────────────────────────────────────────────────────

// Promociones vigentes indexadas por productId. Todas las tarjetas del
// catálogo y el detalle comparten una sola petición, cacheada 5 minutos.
export function useActiveKeyPromotions() {
  const { role } = useAuth(false);
  const query = useQuery({
    queryKey: keyPromotionKeys.active,
    queryFn: getActiveKeyPromotions,
    enabled: role === 'CONSUMER',
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const byProductId = useMemo(() => {
    const map = new Map<number, ActiveKeyPromotionDTO>();
    (query.data ?? []).forEach((promotion) => map.set(promotion.productId, promotion));
    return map;
  }, [query.data]);

  return { ...query, byProductId };
}

// Cotización del checkout: una sola por carrito. Solo se repite cuando cambian
// los productos o las cantidades; lo que depende de las llaves elegidas se
// calcula localmente a partir de esta respuesta.
export function usePurchaseQuote(items: CreatePurchaseItemRequestDTO[]) {
  return useQuery({
    queryKey: keyPromotionKeys.quote(items),
    queryFn: () => purchaseService.quotePurchase({ items }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// ─── Comercial ───────────────────────────────────────────────────────────────

export function useKeyPromotionOffers(enabled = true) {
  return useQuery({
    queryKey: keyPromotionKeys.offers,
    queryFn: CommercialOffers.getOffers,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminKeyPromotions(page: number, size = KEY_PROMOTIONS_PAGE_SIZE) {
  return useQuery({
    queryKey: keyPromotionKeys.adminList(page, size),
    queryFn: () => AdminKeyPromotions.getPromotions(page, size),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAdminKeyPromotion(id: number | null) {
  return useQuery({
    queryKey: keyPromotionKeys.adminDetail(id ?? 0),
    queryFn: () => AdminKeyPromotions.getPromotion(id!),
    enabled: id != null && !isNaN(id),
    staleTime: 15_000,
  });
}
