import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollProps<T> {
  items: T[];
  itemsPerPage: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage = 12,
  hasMore = true,
  onLoadMore
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Inicializar con los primeros elementos
  useEffect(() => {
    const initialItems = items.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);
    setCurrentPage(1);
  }, [items, itemsPerPage]);

  // Función para cargar más elementos
  const loadMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    
    // Simular delay de carga (opcional, para mejor UX)
    await new Promise(resolve => setTimeout(resolve, 500));

    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * itemsPerPage;
    const endIndex = nextPage * itemsPerPage;
    const newItems = items.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      setDisplayedItems(prev => [...prev, ...newItems]);
      setCurrentPage(nextPage);
    }

    // Llamar callback externo si existe
    if (onLoadMore) {
      onLoadMore();
    }

    setLoading(false);
  }, [items, itemsPerPage, currentPage, loading, onLoadMore]);

  // Verificar si hay más elementos disponibles
  const hasMoreItems = displayedItems.length < items.length && hasMore;

  return {
    displayedItems,
    loading,
    hasMore: hasMoreItems,
    loadMore
  };
}