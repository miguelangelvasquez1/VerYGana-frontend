"use client";

import { useEffect, useState } from "react";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from "@/services/ProductService";

export const useFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar favoritos al iniciar
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await getFavorites(0);
        const ids = response.data.map(p => p.id);
        setFavoriteIds(new Set(ids));
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // 🔹 Toggle favorito
  const toggleFavorite = async (productId: number) => {
    if (favoriteIds.has(productId)) {
      await removeFromFavorites(productId);
      setFavoriteIds(prev => {
        const copy = new Set(prev);
        copy.delete(productId);
        return copy;
      });
    } else {
      await addToFavorites(productId);
      setFavoriteIds(prev => new Set(prev).add(productId));
    }
  };

  const isFavorite = (productId: number) => favoriteIds.has(productId);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    loading,
  };
};
