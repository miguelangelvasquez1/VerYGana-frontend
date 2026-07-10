'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getGameRewards } from '@/services/GameService';
import { RewardCardResponseDTO } from '@/types/games/game.types';
import { useCart } from '@/context/CartContext';

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const encodedUrl = searchParams.get('url');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const { addItem, openCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [shouldRotate, setShouldRotate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameHeight, setGameHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!encodedUrl) return;
    setIframeUrl(decodeURIComponent(encodedUrl));
    setLoading(false);
  }, [encodedUrl]);

  useEffect(() => {
    const BOTTOM_NAV_H = 64; // h-16

    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 1024;
      const portrait = h > w;
      setIsMobile(mobile);
      setShouldRotate(mobile && portrait);

      // main.getBoundingClientRect().top = altura del navbar (sin depender del contenido).
      // Usar clientHeight crea dependencia circular: el fallback 100vh empuja main a 100vh
      // y la medición devuelve ese valor incorrecto.
      const main = document.querySelector('main');
      const navbarH = main ? main.getBoundingClientRect().top + window.scrollY : 0;
      setGameHeight(h - navbarH - (mobile ? BOTTOM_NAV_H : 0));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      let data = event.data;

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== 'object') return;

      if (data.type === 'GAME_LOADED') {
        const sessionToken: string = data.sessionToken;
        if (!sessionToken || !iframeRef.current?.contentWindow) return;

        try {
          const rewards: RewardCardResponseDTO[] = await getGameRewards(sessionToken);

          const products = rewards.map((r) => ({
            id: String(r.id),
            name: r.name,
            imageUrl: r.imageUrl,
            imageMessage: r.imageMessage,
            commercial: r.commercial,
            regularPrice: r.regularPrice,
            keysMessage: r.keysMessage,
            rating: r.rating,
          }));

          iframeRef.current.contentWindow.postMessage(
            {
              type: 'PRODUCTS_DATA',
              popupTitle: '¡Canjea tus llaves por estos combos exclusivos!',
              products,
            },
            '*'
          );
        } catch (err) {
          console.error('Error fetching game rewards', err);
          iframeRef.current.contentWindow.postMessage(
            { type: 'PRODUCTS_DATA', popupTitle: '', products: [] },
            '*'
          );
        }
      }

      // TODO: descomentar cuando el nuevo build del juego entregue el DTO completo
      // if (data.type === 'PRODUCT_CLICKED') {
      //   const p = data.product;
      //   if (!p) return;
      //   addItem({
      //     id: Number(p.id),
      //     name: p.name,
      //     imageUrl: p.imageUrl,
      //     price: p.regularPrice,
      //     maxKeysAllowed: p.maxKeysAllowed,
      //     minCashCents: p.minCashCents,
      //     stock: p.stock,
      //     categoryName: p.categoryName,
      //   });
      //   openCart();
      // }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addItem, openCart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: gameHeight ?? '100vh' }}>
        <p className="text-lg font-semibold">Cargando juego...</p>
      </div>
    );
  }

  // Móvil portrait: rotamos el iframe para que el juego aparezca en horizontal
  if (shouldRotate) {
    return (
      <>
        <div className="fixed inset-0 z-[60] bg-black">
          <iframe
            ref={iframeRef}
            src={iframeUrl!}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100dvh',
              height: '100dvw',
              transform: 'translate(-50%, -50%) rotate(-90deg)',
              border: 'none',
            }}
            allowFullScreen
          />
        </div>

        {/* Botón volver – en portrait top-right = landscape top-left */}
        <button
          onClick={() => router.push('/games')}
          className="fixed z-[70] bg-black/60 backdrop-blur-sm text-white rounded-full p-2.5 shadow-lg"
          style={{ top: '12px', right: '12px' }}
          aria-label="Volver a juegos"
        >
          <ArrowLeft className="w-5 h-5 -rotate-90" />
        </button>
      </>
    );
  }

  return (
    <>
      <div
        className="relative w-full bg-black overflow-hidden"
        style={{ height: gameHeight ?? '100vh' }}
      >
        <iframe
          ref={iframeRef}
          src={iframeUrl!}
          className="w-full h-full border-0"
          allowFullScreen
        />

        {/* Botón volver escritorio: relativo al área del juego, no al viewport, para no tapar el navbar del sitio */}
        {!isMobile && (
          <button
            onClick={() => router.push('/games')}
            className="absolute top-4 left-4 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white rounded-full px-3 py-2 text-sm font-medium shadow-lg hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Volver a juegos"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        )}
      </div>

      {/* Botón volver móvil: encima del bottom nav */}
      {isMobile && (
        <button
          onClick={() => router.push('/games')}
          className="fixed bottom-20 left-4 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white rounded-full px-3 py-2 text-sm font-medium shadow-lg"
          aria-label="Volver a juegos"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      )}
    </>
  );
}
