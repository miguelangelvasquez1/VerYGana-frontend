import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
  className = ""
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    // Crear el observer para detectar cuando el sentinel entra en viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        // Activar cuando el sentinel esté a 'threshold' pixeles de ser visible
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, loading, onLoadMore, threshold]);

  // También detectar scroll manual cerca del final
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      // Si estamos cerca del final (dentro del threshold)
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}
      
      {/* Sentinel para Intersection Observer */}
      <div ref={sentinelRef} className="h-10" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600 text-sm font-medium">Cargando más productos...</p>
          </div>
        </div>
      )}
      
      {/* End message */}
      {!hasMore && !loading && (
        <div className="text-center py-12 border-t border-gray-200 mt-8">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ¡Has visto todos los productos!
            </h3>
            <p className="text-gray-500 text-sm">
              No hay más productos que mostrar con los filtros actuales. 
              Prueba ajustando tus filtros para ver más resultados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;