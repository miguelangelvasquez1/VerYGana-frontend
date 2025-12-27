
export const getTransactionTitle = (type: string) => {
  switch (type) {
    case "DEPOSIT":
      return "Depósito creado";
    case "WITHDRAWAL":
      return "Retiro solicitado";
    case "POINTS_AD_LIKE_REWARD":
      return "Recompensa por ver anuncio";
    case "POINTS_GAME_PLAYED":
      return "Recompensa por jugar";
    case "RAFFLE_PRIZE":
      return "Premio de rifa ganado";
    case "RAFFLE_PARTICIPATION":
      return "Participación en rifa";
    case "WHOLE_PURCHASE":
      return "Compra realizada";
    case "DATA_RECHARGE":
      return "Recarga de datos";
    case "GIFT_TRANSFER_SENT":
      return "Transferencia enviada";
    case "GIFT_TRANSFER_RECEIVED":
      return "Transferencia recibida";
    default:
      return "Movimiento de saldo";
  }
};
