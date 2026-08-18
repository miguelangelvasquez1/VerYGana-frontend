import apiClient from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Recorrido de una solicitud:
 *
 *   PENDING → IN_REVIEW → APPROVED → ITEM_IN_PROGRESS → COMPLETED
 *                    ↘ REJECTED (final alterno, en cualquier punto)
 *
 * Hasta APPROVED manda el admin; de ahí en adelante, el diseñador asignado.
 * Aprobar exige elegir diseñador: sin asignación nadie ve la solicitud.
 */
export type PetRequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'ITEM_IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export interface PetRequest {
  id: number;
  productName: string;
  description: string;
  /** `null` cuando el comercio envió la solicitud sin imagen. */
  imageObjectKey: string | null;
  /** URL lista para `<img src>` — no la construyas desde `imageObjectKey`. */
  imageUrl?: string;
  desiredEffects: string;
  status: PetRequestStatus;
  rejectionReason?: string;
  resultCatalogItemId?: number;
  createdAt: string;
  updatedAt: string;
  commercialName?: string;
  /** Presentes una vez el admin asigna diseñador. */
  assignedDesignerUserId?: number | null;
  assignedDesignerName?: string | null;
  adminNotes?: string | null;
}

/**
 * El detalle trae además el borrador del diseñador. Es un objeto JSON libre:
 * el backend lo guarda tal cual, así que acá no se valida su forma.
 */
export interface PetRequestDetail extends PetRequest {
  draft?: PetItemDraft | null;
}

/** Borrador libre. Las claves de `PetCatalogItemBody` son las que publica el ítem. */
export type PetItemDraft = Record<string, unknown>;

export interface PetCatalogItemBody {
  name: string;
  description: string;
  imageObjectKey: string;
  effects: string;
}

export interface SubmitPetRequestBody {
  productName: string;
  description: string;
  /** `null` cuando la solicitud va sin imagen — es opcional. */
  imageObjectKey: string | null;
  desiredEffects: string;
}

/** Lo que declaramos del archivo para que el backend firme la subida. */
export interface PetImageUploadRequest {
  contentType: string;
  originalFileName: string;
  sizeBytes: number;
}

export interface PetImageUploadPermission {
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface PetDesigner {
  userId: number;
  name: string;
  lastName?: string;
  designerCode?: string;
  email?: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
//
// Ojo con el prefijo: los endpoints de admin van bajo `/api/admin/**`, mientras
// que los de comercial y diseñador cuelgan de la raíz.

export const adminGetPetRequests = async (
  status?: PetRequestStatus
): Promise<PetRequest[]> => {
  const { data } = await apiClient.get('/api/admin/pet-requests', {
    params: status ? { status } : undefined,
  });
  return data;
};

export const adminGetPetRequestDetail = async (
  id: number,
  signal?: AbortSignal
): Promise<PetRequestDetail> => {
  const { data } = await apiClient.get(`/api/admin/pet-requests/${id}`, { signal });
  return data;
};

export const adminGetPetDesigners = async (): Promise<PetDesigner[]> => {
  const { data } = await apiClient.get('/api/admin/pet-requests/designers');
  return data;
};

export const adminMarkPetRequestInReview = async (id: number): Promise<void> => {
  await apiClient.patch(`/api/admin/pet-requests/${id}/review`);
};

/** Aprobar exige diseñador: sin `designerUserId` la solicitud no le llega a nadie. */
export const adminApprovePetRequest = async (
  id: number,
  designerUserId: number,
  adminNotes?: string
): Promise<void> => {
  await apiClient.patch(`/api/admin/pet-requests/${id}/approve`, {
    designerUserId,
    adminNotes: adminNotes?.trim() || undefined,
  });
};

export const adminAssignPetDesigner = async (
  id: number,
  designerUserId: number
): Promise<void> => {
  await apiClient.patch(`/api/admin/pet-requests/${id}/assign-designer`, { designerUserId });
};

export const adminRejectPetRequest = async (id: number, reason: string): Promise<void> => {
  await apiClient.patch(`/api/admin/pet-requests/${id}/reject`, { reason });
};

// ── Game Designer ─────────────────────────────────────────────────────────────
//
// La bandeja trae SOLO lo asignado a este diseñador. Aprobar, rechazar y marcar
// en revisión son del admin — acá no existen.

export const getGameDesignerPetRequests = async (
  status?: PetRequestStatus
): Promise<PetRequest[]> => {
  const { data } = await apiClient.get('/game-designer/pet/requests', {
    params: status ? { status } : undefined,
  });
  return data;
};

export const getGameDesignerPetRequestDetail = async (
  id: number,
  signal?: AbortSignal
): Promise<PetRequestDetail> => {
  const { data } = await apiClient.get(`/game-designer/pet/requests/${id}`, { signal });
  return data;
};

/**
 * Se puede llamar tantas veces como haga falta antes de publicar, pero el
 * backend NO hace merge: reemplaza el borrador por lo que llegue. Hay que
 * mandar siempre el objeto completo — un PATCH con solo los campos tocados
 * borra el resto.
 */
export const savePetRequestDraft = async (
  id: number,
  draft: PetItemDraft
): Promise<void> => {
  await apiClient.patch(`/game-designer/pet/requests/${id}/draft`, draft);
};

/** Crea el ítem del catálogo con lo que haya en el borrador y cierra la solicitud. */
export const publishPetRequest = async (id: number): Promise<PetRequestDetail> => {
  const { data } = await apiClient.post(`/game-designer/pet/requests/${id}/publish`);
  return data;
};

// ── Hilo de conversación ──────────────────────────────────────────────────────
//
// Mismo contrato para los tres roles; solo cambia el prefijo. Un 404 significa
// "no existe o no es tuya" a propósito: el backend no confirma la existencia de
// solicitudes ajenas. Trátalo como "no encontrada", nunca como error de permisos.

export type PetCommentRole = 'COMMERCIAL' | 'DESIGNER' | 'ADMIN';

export interface PetComment {
  id: number;
  content: string;
  authorName: string;
  authorRole: PetCommentRole;
  /** Estado de la solicitud cuando se escribió — sirve de separador de contexto. */
  relatedStatus: PetRequestStatus;
  createdAt: string;
}

export const PET_COMMENT_MAX_LENGTH = 2000;

const COMMENT_BASE: Record<PetCommentRole, (id: number) => string> = {
  COMMERCIAL: id => `/commercial/pet/requests/${id}/comments`,
  DESIGNER:   id => `/game-designer/pet/requests/${id}/comments`,
  ADMIN:      id => `/api/admin/pet-requests/${id}/comments`,
};

export const getPetComments = async (
  role: PetCommentRole,
  id: number,
  signal?: AbortSignal
): Promise<PetComment[]> => {
  const { data } = await apiClient.get(COMMENT_BASE[role](id), { signal });
  return data;
};

export const postPetComment = async (
  role: PetCommentRole,
  id: number,
  content: string
): Promise<PetComment> => {
  const { data } = await apiClient.post(COMMENT_BASE[role](id), { content });
  return data;
};

// ── Escenas ───────────────────────────────────────────────────────────────────

export interface PetSceneObject {
  objectId: string;
  /** El backend no restringe valores; `background`, `image` y `video` son los conocidos. */
  type: string;
  objectKey: string;
  /**
   * URL pública del asset, sólo de lectura: la arma el backend a partir de
   * `objectKey` y sirve para la miniatura. No se manda al guardar — lo que el
   * backend persiste es `objectKey`.
   */
  url?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleMultiplier?: number | null;
}

export interface PetScene {
  /**
   * Clave primaria de la fila: es la que va en la RUTA de update y delete.
   *
   * No confundir con `sceneId`, que es el número con el que el juego agrupa sus
   * objetos y no identifica la fila. Mandar `sceneId` en la ruta devuelve
   * "Scene not found". Sólo llega al listar; al crear todavía no existe.
   */
  id?: number;
  sceneId: number;
  active?: boolean | null;
  objects: PetSceneObject[];
}

/**
 * Subida de assets del diseñador (paso 1 de 2). Es el equivalente de
 * `/commercial/pet/requests/image`, pero sin `commercialId` en la ruta: sirve
 * tanto para objetos de escena como para sprites del catálogo.
 *
 * El paso 2 —el PUT a `uploadUrl`— NO puede pasar por `apiClient`: la URL viene
 * prefirmada por R2 y el interceptor le añadiría `Authorization`, con lo que la
 * firma deja de validar y R2 responde 403. Va con `fetch` crudo y el mismo
 * `Content-Type` que se declaró acá, porque también entra en la firma.
 * Ver `usePetSceneAssetUpload`.
 */
export type DesignerAssetKind = 'SCENE_OBJECT' | 'CATALOG_SPRITE';

export interface DesignerAssetRequest {
  kind: DesignerAssetKind;
  contentType: string;
  originalFileName: string;
  sizeBytes: number;
}

export const prepareDesignerAsset = async (
  body: DesignerAssetRequest
): Promise<PetImageUploadPermission> => {
  const { data } = await apiClient.post('/game-designer/pet/assets', body);
  return data;
};

export const getPetScenes = async (signal?: AbortSignal): Promise<PetScene[]> => {
  const { data } = await apiClient.get('/game-designer/pet/scenes', { signal });
  return data;
};

export const createPetScene = async (scene: PetScene): Promise<PetScene> => {
  const { data } = await apiClient.post('/game-designer/pet/scenes', scene);
  return data;
};

export const updatePetScene = async (id: number, scene: PetScene): Promise<PetScene> => {
  const { data } = await apiClient.put(`/game-designer/pet/scenes/${id}`, scene);
  return data;
};

export const deletePetScene = async (id: number): Promise<void> => {
  await apiClient.delete(`/game-designer/pet/scenes/${id}`);
};

// ── Commercial ────────────────────────────────────────────────────────────────

/**
 * Paso 1 de la subida: pide una URL prefirmada para dejar la imagen en R2.
 * La `uploadUrl` caduca (ver `expiresInSeconds`), así que se pide al elegir
 * el archivo y se sube de inmediato — no al enviar el formulario.
 */
export const requestPetImageUpload = async (
  body: PetImageUploadRequest
): Promise<PetImageUploadPermission> => {
  const { data } = await apiClient.post('/commercial/pet/requests/image', body);
  return data;
};

export const submitPetRequest = async (
  body: SubmitPetRequestBody
): Promise<PetRequest> => {
  const { data } = await apiClient.post('/commercial/pet/requests', body);
  return data;
};

export const getMyPetRequests = async (): Promise<PetRequest[]> => {
  const { data } = await apiClient.get('/commercial/pet/requests');
  return data;
};
