"use client";

import { EarningsByMonthResponseDTO } from "@/types/transaction.types";

const MONTHS_MAP: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

interface Props {
  data: EarningsByMonthResponseDTO;
  onClick: () => void;
}

export default function MonthlyEarningsCard({ data, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 text-left w-full cursor-pointer"
    >
      <p className="text-sm text-gray-500">{data.year}</p>

      <h4 className="text-lg font-semibold text-gray-900 mt-1">
        {MONTHS_MAP[data.month]}
      </h4>

      <p className="text-xl font-bold text-pink-600 mt-2">
        ${data.earnings.toLocaleString("es-CO")}
      </p>
    </button>
  );
}
