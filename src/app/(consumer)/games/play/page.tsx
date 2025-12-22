'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface GameSessionData {
  sessionToken: string;
  iframeUrl: string;
}

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;

    // 🔴 TEMPORAL: luego viene del backend
    const baseIframeUrl = '/dummy-game.html';

    const url = `${baseIframeUrl}?sessionToken=${sessionToken}`;

    setIframeUrl(url);
    setLoading(false);
  }, [sessionToken]);

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
      />
    </div>
  );
}
