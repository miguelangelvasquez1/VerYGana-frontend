'use client';

import React, { useEffect } from 'react';
import { X, Play, AlertTriangle } from 'lucide-react';

/**
 * Previsualiza una escena en el build de Unity.
 *
 * La URL se arma a mano a propósito. `usePetSession` NO sirve acá: llama a
 * `/pet/session/init`, que exige rol CONSUMER, y el diseñador no lo es — daría
 * 403 y parecería que el preview está roto. El preview no necesita sesión ni
 * JWT: `/pet/scenes` es público y el token literal `preview` sustituye a la
 * validación.
 */
export function ScenePreviewModal({
  sceneId,
  onClose,
}: {
  sceneId: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const base = process.env.NEXT_PUBLIC_PET_GAME_URL;
  const previewUrl = base
    ? `${base}?session_token=preview&user_hash=${sceneId}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4"
      onClick={onClose}
    >
      {/* El build es 16:9 y se enmarca solo: cuanto más área tenga, más grande se
          ve. Por eso ocupa casi toda la ventana en vez de un modal centrado. */}
      <div
        className="flex h-[95vh] w-full max-w-[1800px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <Play size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Vista previa · escena {sceneId}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {previewUrl ? (
          <>
            <p className="shrink-0 border-b border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-500">
              Se muestra lo que hay guardado en el servidor. Guarda antes de previsualizar para
              ver los cambios.
            </p>
            <div className="min-h-0 flex-1 bg-[#231f20]">
              <iframe
                src={previewUrl}
                title={`Vista previa de la escena ${sceneId}`}
                className="block h-full w-full border-0"
                allow="autoplay; fullscreen *"
                allowFullScreen
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium text-gray-700">
              Falta configurar <code className="font-mono text-xs">NEXT_PUBLIC_PET_GAME_URL</code>
            </p>
            <p className="max-w-sm text-xs text-gray-500">
              Sin esa variable no se sabe dónde está el build del juego, así que no se puede
              previsualizar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
