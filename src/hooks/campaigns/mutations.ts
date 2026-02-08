import { CampaignDetails } from "@/types/games/campaigns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignKeys } from "./campaignKeys";
import { campaignService } from "@/services/campaignService";

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: number;
      data: CampaignDetails;
    }) => campaignService.updateCampaign(campaignId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      status,
    }: {
      campaignId: number;
      status: string;
    }) => campaignService.updateCampaignStatus(campaignId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}