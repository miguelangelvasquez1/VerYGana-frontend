'use client';

import { PurchaseResponseDTO } from "@/types/purchases/purchase.types";
import { useState } from "react";
import LeaveReviewModal from "../reviews/LeaveReviewModal";

interface Props {
  purchase: PurchaseResponseDTO;
}

const PurchaseActions = ({ purchase }: Props) => {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <button
        className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50"
        onClick={() => setReviewOpen(true)}
      >
        Dejar una reseña
      </button>

      <LeaveReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        purchaseId={purchase.id}
      />
    </div>
  );
};

export default PurchaseActions;
