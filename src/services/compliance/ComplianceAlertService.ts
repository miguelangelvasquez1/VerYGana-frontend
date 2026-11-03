import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";
import type {
  Alert,
  AlertReviewRequest,
  AlertRule,
  AlertRuleRequest,
} from "@/types/compliance/InformationRequest.types";

export interface AlertListParams {
  pendingOnly: boolean;
  page: number; // base 0
  size: number;
}

// Alertas automáticas y las reglas que las generan.
export const ComplianceAlertService = {
  async listAlerts(params: AlertListParams): Promise<PagedResponse<Alert>> {
    const response = await apiClient.get<PagedResponse<Alert>>("/compliance/alerts", { params });
    return response.data;
  },

  async reviewAlert(id: number, body: AlertReviewRequest): Promise<Alert> {
    const response = await apiClient.post<Alert>(`/compliance/alerts/${id}/review`, body);
    return response.data;
  },

  async listRules(): Promise<AlertRule[]> {
    const response = await apiClient.get<AlertRule[]>("/compliance/alert-rules");
    return response.data;
  },

  async createRule(body: AlertRuleRequest): Promise<AlertRule> {
    const response = await apiClient.post<AlertRule>("/compliance/alert-rules", body);
    return response.data;
  },

  async deactivateRule(id: number): Promise<AlertRule> {
    const response = await apiClient.post<AlertRule>(`/compliance/alert-rules/${id}/deactivate`);
    return response.data;
  },
};
