'use client';
import { useEffect, useRef, useCallback } from 'react';
import { PetGameIncomingMessage, PetGameOutgoingMessage } from '@/types/keys/petBridge.types';
import apiClient from '@/lib/api/client';

export function usePetBridge() {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const sendToGame = useCallback((message: PetGameOutgoingMessage) => {
        console.log('📤 sendToGame llamado, iframe:', iframeRef.current);
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;
        iframe.contentWindow.postMessage(message, '*');
    }, []);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            const data = event.data as PetGameIncomingMessage;
            if (!data?.type) return;

            if (data.type === 'GET_KEYS_BALANCE') {
                try {
                    const res = await apiClient.get('/consumer/wallet/keys/balance');
                    sendToGame({
                        type: 'KEYS_BALANCE_RESPONSE',
                        requestId: data.requestId,
                        payload: {
                            balance: res.data.balance,
                            currency: res.data.currency
                        }
                    });
                } catch {
                    sendToGame({
                        type: 'KEYS_BALANCE_RESPONSE',
                        requestId: data.requestId,
                        payload: {
                            balance: 0,
                            currency: 'keys'
                        }
                    });
                }
            }

            if (data.type === 'SPEND_KEYS') {
                try {
                    const res = await apiClient.post('/consumer/wallet/keys/spend', {
                        amount: data.payload.amount,
                        itemId: data.payload.item_id,
                        itemName: data.payload.item_name,
                    });
                    sendToGame({
                        type: 'SPEND_KEYS_RESPONSE',
                        requestId: data.requestId,
                        payload: {
                            success: res.data.success,
                            new_balance: res.data.newBalance,
                            error: res.data.error
                        }
                    });
                } catch {
                    sendToGame({
                        type: 'SPEND_KEYS_RESPONSE',
                        requestId: data.requestId,
                        payload: {
                            success: false,
                            new_balance: null,
                            error: 'Error al procesar el gasto'
                        }
                    });
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [sendToGame]);

    return { iframeRef };
}