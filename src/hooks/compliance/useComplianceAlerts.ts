'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { retryUnlessForbiddenOrMissing } from '@/hooks/commercial/retryPolicy';
import { QUEUE_PAGE_SIZE, type AlertsState } from '@/lib/compliance/routes';
import { ComplianceAlertService } from '@/services/compliance/ComplianceAlertService';
import type {
  Alert,
  AlertReviewRequest,
  AlertRule,
  AlertRuleRequest,
} from '@/types/compliance/InformationRequest.types';
import { COMPLIANCE_INVALIDATIONS, complianceAlertKeys, complianceAlertRuleKeys } from './complianceKeys';

// Página base 1 en la URL; a la API va base 0.
export function useAlerts({ pendingOnly, page }: AlertsState) {
  return useQuery({
    queryKey: complianceAlertKeys.list(pendingOnly, page),
    queryFn: () => ComplianceAlertService.listAlerts({ pendingOnly, page: page - 1, size: QUEUE_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useReviewAlert(alertId: number) {
  const queryClient = useQueryClient();
  return useMutation<Alert, unknown, AlertReviewRequest>({
    mutationFn: (body) => ComplianceAlertService.reviewAlert(alertId, body),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.alertReviewed.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export function useAlertRules() {
  return useQuery({
    queryKey: complianceAlertRuleKeys.all,
    queryFn: () => ComplianceAlertService.listRules(),
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation<AlertRule, unknown, AlertRuleRequest>({
    mutationFn: (body) => ComplianceAlertService.createRule(body),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.alertRuleChanged.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export function useDeactivateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation<AlertRule, unknown, number>({
    mutationFn: (ruleId) => ComplianceAlertService.deactivateRule(ruleId),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.alertRuleChanged.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
