'use client';

import { ConsumerPurchaseResponseDTO } from "@/types/purchases/purchase.types";
import { useState } from "react";
import LeaveReviewModal, { canReviewPurchaseItem } from "../reviews/LeaveReviewModal";
import ReportIssueModal, { canReportPurchaseItem } from "./ReportIssueModal";

interface Props {
  purchase: ConsumerPurchaseResponseDTO;
}

const PurchaseActions = ({ purchase }: Props) => {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const canReportAny = purchase.items.some(canReportPurchaseItem);
  const canReviewAny = purchase.items.some(canReviewPurchaseItem);

  return (
    <div className="flex justify-end gap-2">
      {canReportAny && (
        <button
          className="px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
          onClick={() => setReportOpen(true)}
        >
          Reportar un problema
        </button>
      )}

      {canReviewAny && (
        <button
          className="px-4 py-2 rounded-full border border-[#03548C]/30 text-[#03548C] text-sm font-semibold hover:bg-[#03548C]/5 active:scale-95 transition-all cursor-pointer"
          onClick={() => setReviewOpen(true)}
        >
          Dejar una reseña
        </button>
      )}

      <LeaveReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        items={purchase.items}
      />

      <ReportIssueModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        items={purchase.items}
      />
    </div>
  );
};

export default PurchaseActions;
