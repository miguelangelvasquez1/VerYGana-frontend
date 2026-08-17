/** Respuesta de POST /pet/session/init (PetSessionResponseDTO en el backend). */
export interface PetSessionResponse {
  url: string;
}

/** Credenciales de sesión que el juego necesita para pegarle a /pet/**. */
export interface PetSessionParams {
  sessionToken: string;
  userHash: string;
}
