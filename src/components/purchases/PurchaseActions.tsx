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
        className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50"
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
