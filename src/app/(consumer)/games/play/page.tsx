'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const encodedUrl = searchParams.get('url');

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    if (!encodedUrl) return;

    const decodedUrl = decodeURIComponent(encodedUrl);
    setIframeUrl(decodedUrl);
    setLoading(false);
  }, [encodedUrl]);

  //Para el mensaje de finished
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
    // 1. Validar origen (MUY importante en producción)
    // if (event.origin !== "https://tudominio.com") return; <-- HACER

    let data = event.data;

    // 2. Si llega como string, parsearlo
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        console.warn("Mensaje no es JSON válido");
        return;
      }
    }

    // 3. Validar estructura
    if (!data || typeof data !== "object") return;

    if (data.type === "GAME_FINISHED") {
      console.log("¿Victoria?", data.isVictory);
      setGameFinished(true); //true

      if (data.isVictory) {
        // lógica de victoria
      } else {
        // lógica de derrota
      }
    }
  };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Cargando juego...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black">
      <iframe
        src={iframeUrl!}
        className="w-full h-full border-0"
        allow="fullscreen"
        allowFullScreen
      />

    {/* Cuando el juego se termina muestra: */}
    {gameFinished && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-white p-8 rounded-xl text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              🎉 Juego terminado
            </h2>
            <p className="mb-6">El evento GAME_FINISHED fue recibido correctamente.</p>
            <button
              onClick={() => window.location.href = '/games'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
