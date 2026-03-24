"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import * as transactionService from "@/services/TransactionService";
import { PagedResponse } from "@/types/GenericTypes";
import { TransactionPayoutResponseDTO } from "@/types/transaction.types";


interface Props {
  year: number;
  month: number;
}

export default function SellerPayoutsList({ year, month }: Props) {
  const [page, setPage] = useState(0);
  const [data, setData] =
    useState<PagedResponse<TransactionPayoutResponseDTO> | null>(null);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 5;

  useEffect(() => {
    const loadPayouts = async () => {
      try {
        setLoading(true);
        const response = await transactionService.getSellerPayoutsPage(
          year,
          month,
          PAGE_SIZE,
          page
        );
        setData(response);
      } catch (error) {
        console.error("Error loading payouts", error);
      } finally {
        setLoading(false);
      }
    };

    loadPayouts();
  }, [year, month, page]);

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">

      {loading || !data ? (
        <p className="text-gray-500">Cargando pagos...</p>
      ) : data.data.length === 0 ? (
        <p className="text-gray-500">No hay pagos en este período</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="py-2 text-left">Estado</th>
                  <th className="py-2 text-left">Fecha</th>
                  <th className="py-2 text-left">Pagado</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>

              <tbody>
                {data.data.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 capitalize">
                      {payout.transactionState}
                    </td>

                    <td className="py-3">
                      {new Date(payout.createdAt).toLocaleDateString("es-CO", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="py-3 font-semibold">
                      ${payout.amount.toLocaleString("es-CO")}
                    </td>

                    <td className="py-3 text-right text-gray-400">
                      <ChevronRight className="inline w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.data.map((payout) => (
              <div
                key={payout.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    ${payout.amount.toLocaleString("es-CO")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(payout.createdAt).toLocaleDateString("es-CO")}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {payout.transactionState}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center pt-4">
            <button
              disabled={!data.meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm px-3 py-1 rounded border disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="text-sm text-gray-500">
              Página {data.meta.page + 1} de {data.meta.totalPages}
            </span>

            <button
              disabled={!data.meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm px-3 py-1 rounded border disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
