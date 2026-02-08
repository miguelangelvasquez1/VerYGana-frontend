// types/campaigns/gameConfig.ts

/**
 * Definición de esquema para validación de campos
 */
export interface SchemaDefinition {
  type?: 'string' | 'number' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: SchemaDefinition | string;
  [key: string]: any;
}

/**
 * Definición de configuración de juego (del backend)
 */
export interface GameConfigDefinition {
  jsonKey: string;
  required: boolean;
  description: string;
  schema: Record<string, any>;
}

/**
 * Datos del formulario de configuración de juego
 */
export interface GameConfigFormData {
  colors?: Record<string, string>;
  texts?: Record<string, string>;
  rewards?: Record<string, number>;
  questions?: {
    questions: Array<{
      question: string;
      answers: string[];
      correctIndex: number;
    }>;
  };
  hangman?: {
    word: string;
    hint: string;
    score: number;
  };
  [key: string]: any; // Para cualquier otra configuración
}

/**
 * DTO para enviar al backend
 */
export interface GameConfigDTO {
  gameConfig: Record<string, any>;
  colors: Record<string, string>;
  texts: Record<string, string>;
  gameSpecifications: Record<string, any>;
}

/**
 * Props para el componente de formulario
 */
export interface GameConfigFormProps {
  gameId: number;
  definitions: GameConfigDefinition[];
  initialData?: GameConfigFormData;
  onSubmit: (data: GameConfigFormData) => void;
  onBack: () => void;
}