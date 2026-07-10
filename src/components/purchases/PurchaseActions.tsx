'use client';

import { ConsumerPurchaseResponseDTO } from "@/types/purchases/purchase.types";
import { useState } from "react";
import LeaveReviewModal from "../reviews/LeaveReviewModal";

interface Props {
  purchase: ConsumerPurchaseResponseDTO;
}

const PurchaseActions = ({ purchase }: Props) => {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <button
        className="px-4 py-2 rounded-full border border-[#03548C]/30 text-[#03548C] text-sm font-semibold hover:bg-[#03548C]/5 active:scale-95 transition-all"
        onClick={() => setReviewOpen(true)}
      >
        Dejar una reseña
      </button>

      <LeaveReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        items={purchase.items}
      />
    </div>
  );
};

export default PurchaseActions;
