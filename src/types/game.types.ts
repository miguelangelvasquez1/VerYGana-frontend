export interface GameCardResponseDTO {
  id: number;
  title: string;
  imageUrl: string;
  sponsored: boolean;
  rewardText?: string; // ej: "Gana hasta $500"
}