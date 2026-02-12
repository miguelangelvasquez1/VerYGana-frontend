'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const encodedUrl = searchParams.get('url');

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!encodedUrl) return;

    const decodedUrl = decodeURIComponent(encodedUrl);
    setIframeUrl(decodedUrl);
    setLoading(false);
  }, [encodedUrl]);

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
    </div>
  );
}
