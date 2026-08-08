"use client";

import { usePlanState } from "@/components/commercial/layout/DashboardLayout";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import CommercialProfileSeller from "@/components/commercial/profile/CommercialProfileSeller";
import CommercialProfilePremium from "@/components/commercial/profile/CommercialProfilePremium";

export default function CommercialProfilePage() {
  const { planState, loadingPlan } = usePlanState();

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (planState?.effectivePlan === PlanCode.PREMIUM) {
    return <CommercialProfilePremium />;
  }

  return <CommercialProfileSeller />;
}
