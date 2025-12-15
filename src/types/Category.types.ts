export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CategoryResponseDTO {
  id: number;
  name: string;
}