"use client";

import { useState } from "react";

import { EarningsByMonthResponseDTO } from "@/types/transaction.types";

import MonthlyEarningsCard from "./MonthlyEarningsCard";
import MonthlyEarningsModal from "./MonthlyEarningsModal";

interface Props {
  data: EarningsByMonthResponseDTO[];
}

export default function SellerEarningsCards({ data }: Props) {
  const [selected, setSelected] =
    useState<EarningsByMonthResponseDTO | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((item) => (
          <MonthlyEarningsCard
            key={`${item.year}-${item.month}`}
            data={item}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>

      {selected && (
        <MonthlyEarningsModal
          year={selected.year}
          month={selected.month}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
