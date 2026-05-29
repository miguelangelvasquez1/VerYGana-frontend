export type PetGameIncomingMessage =
  | { type: 'GET_KEYS_BALANCE'; requestId: string }
  | {
      type: 'SPEND_KEYS';
      requestId: string;
      payload: {
        amount: number;
        item_id: number;
        item_name: string;
      };
    };

// Mensajes que tu frontend ENVÍA al juego
export type PetGameOutgoingMessage =
  | {
      type: 'KEYS_BALANCE_RESPONSE';
      requestId: string;
      payload: {
        balance: number;
        currency: string;
      };
    }
  | {
      type: 'SPEND_KEYS_RESPONSE';
      requestId: string;
      payload: {
        success: boolean;
        new_balance: number | null;
        error: string | null;
      };
    }

