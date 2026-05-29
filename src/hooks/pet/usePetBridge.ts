'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PetGameIncomingMessage, PetGameOutgoingMessage } from '@/types/keys/petBridge.types';


const POLLING_INTERVAL_MS = 60000; // 60 segundos

export function usePetBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  console.log('🐾 usePetBridge montado'); // ← agrega esta línea

  // Helper para enviar mensajes al juego
  const sendToGame = useCallback((message: PetGameOutgoingMessage) => {
    console.log('📤 Enviando al juego, iframe:', iframeRef.current);0
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(message, '*');
  }, []);

  // Maneja mensajes que llegan DEL juego
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
        console.log('🎯 Mensaje recibido:', event.data);
      const data = event.data as PetGameIncomingMessage;
      if (!data?.type) return;

      // Consultar saldo de llaves
      if (data.type === 'GET_KEYS_BALANCE') {
        // TODO: reemplazar con llamada real cuando wallet esté implementado
        // const res = await apiClient.get('/wallet/keys/balance');
        // const balance = res.data.balance;
        const balance = 0; // MOCK temporal

        sendToGame({
          type: 'KEYS_BALANCE_RESPONSE',
          requestId: data.requestId,
          payload: { balance, currency: 'keys' }
        });
      }

      // Gastar llaves
      if (data.type === 'SPEND_KEYS') {
        // TODO: reemplazar con llamada real cuando wallet esté implementado
        // try {
        //   const res = await apiClient.post('/wallet/keys/spend', {
        //     amount: data.payload.amount,
        //     itemId: data.payload.item_id,
        //     itemName: data.payload.item_name,
        //   });
        //   sendToGame({
        //     type: 'SPEND_KEYS_RESPONSE',
        //     requestId: data.requestId,
        //     payload: { success: true, new_balance: res.data.newBalance, error: null }
        //   });
        // } catch (err: any) {
        //   sendToGame({
        //     type: 'SPEND_KEYS_RESPONSE',
        //     requestId: data.requestId,
        //     payload: { success: false, new_balance: null, error: 'Saldo insuficiente' }
        //   });
        // }

        // MOCK temporal — siempre rechaza hasta que wallet esté implementado
        sendToGame({
          type: 'SPEND_KEYS_RESPONSE',
          requestId: data.requestId,
          payload: {
            success: false,
            new_balance: null,
            error: 'Sistema de llaves en mantenimiento'
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendToGame]);

  return { iframeRef };
}