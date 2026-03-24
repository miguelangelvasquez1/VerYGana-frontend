import apiClient from "@/lib/api/client";

export interface AvatarDTO {
  id: number;
  name: string;
  imageUrl: string;
}

export const getActiveAvatars = async (): Promise<AvatarDTO[]> => {
  const response = await apiClient.get("/avatars");
  return response.data;
};