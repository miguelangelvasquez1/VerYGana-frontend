import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  children: React.ReactNode;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  loading,
  hasMore,
  onLoadMore,
  threshold = 200,
  className = "",
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(loading);

  // Mantener ref sincronizada
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}

      <div ref={sentinelRef} className="h-10" />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {!hasMore && !loading && (
        <div className="text-center py-12 text-gray-500">
          ¡Has visto todos los productos!
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;
