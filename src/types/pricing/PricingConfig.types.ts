export enum PricingType {
  SURVEY_REWARD_PER_QUESTION_CENTS = 'SURVEY_REWARD_PER_QUESTION_CENTS',
  GAME_COST_PER_POINT_CENTS = 'GAME_COST_PER_POINT_CENTS',
  GAME_COST_PER_VICTORY_CENTS = 'GAME_COST_PER_VICTORY_CENTS',
  AD_COST_PER_SECOND_CENTS = 'AD_COST_PER_SECOND_CENTS',
}

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  [PricingType.SURVEY_REWARD_PER_QUESTION_CENTS]: 'Recompensa por pregunta (Encuesta)',
  [PricingType.GAME_COST_PER_POINT_CENTS]: 'Costo por punto (Juego)',
  [PricingType.GAME_COST_PER_VICTORY_CENTS]: 'Costo por victoria (Juego)',
  [PricingType.AD_COST_PER_SECOND_CENTS]: 'Costo por segundo (Anuncio)',
};

export const PRICING_TYPE_DESCRIPTIONS: Record<PricingType, string> = {
  [PricingType.SURVEY_REWARD_PER_QUESTION_CENTS]: 'Centavos que gana el usuario por cada pregunta respondida en una encuesta',
  [PricingType.GAME_COST_PER_POINT_CENTS]: 'Centavos que cuesta al usuario cada punto obtenido en un juego',
  [PricingType.GAME_COST_PER_VICTORY_CENTS]: 'Centavos que cuesta al usuario ganar una partida',
  [PricingType.AD_COST_PER_SECOND_CENTS]: 'Centavos que se cobran al anunciante por segundo de reproducción',
};

export interface PricingConfigDTO {
  id: number;
  version: number;
  type: PricingType;
  amountInCents: number;
  currency: string;
  active: boolean;
  description: string;
  createdAt: string;
}
