'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getGameRewards } from '@/services/GameService';
import { RewardCardResponseDTO } from '@/types/games/game.types';
import { useCart } from '@/context/CartContext';

export default function PlayGamePage() {
  const searchParams = useSearchParams();
  const encodedUrl = searchParams.get('url');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { addItem, openCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!encodedUrl) return;
    setIframeUrl(decodeURIComponent(encodedUrl));
    setLoading(false);
  }, [encodedUrl]);

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
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Cargando juego...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black">
      <iframe
        ref={iframeRef}
        src={iframeUrl!}
        className="w-screen h-screen border-0"
        allowFullScreen
      />
    </div>
  );
}
