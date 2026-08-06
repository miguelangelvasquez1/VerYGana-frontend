"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

import { getMyPromotions, togglePromotion } from "@/services/AlliesService";
import { AllyPromotionResponseDTO } from "@/types/Allies.types";

export function useAllyPromotions() {
  const [promotions, setPromotions] = useState<AllyPromotionResponseDTO[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotedIds, setPromotedIds] = useState<Set<number>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const loadPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    try {
      const res = await getMyPromotions();
      setPromotions(res);
      setPromotedIds(new Set(res.map((p) => p.productId)));
    } catch {
      toast.error("Error al cargar tus promociones.");
    } finally {
      setPromotionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleTogglePromote = useCallback(
    async (productId: number) => {
      const wasPromoted = promotedIds.has(productId);

      setPromotedIds((prev) => {
        const next = new Set(prev);
        wasPromoted ? next.delete(productId) : next.add(productId);
        return next;
      });
      setTogglingIds((prev) => new Set(prev).add(productId));

      try {
        await togglePromotion(productId);
        toast.success(
          wasPromoted
            ? "Producto retirado de tus promociones."
            : "Producto añadido a tus promociones."
        );
        await loadPromotions();
      } catch (err: any) {
        setPromotedIds((prev) => {
          const next = new Set(prev);
          wasPromoted ? next.add(productId) : next.delete(productId);
          return next;
        });
        toast.error(err?.response?.data?.message || "Error al actualizar la promoción.");
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [promotedIds, loadPromotions]
  );

  return {
    promotions,
    promotionsLoading,
    promotedIds,
    togglingIds,
    handleTogglePromote,
    reloadPromotions: loadPromotions,
  };
}
