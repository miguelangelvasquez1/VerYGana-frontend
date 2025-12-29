import { TransactionResponseDTO } from "@/types/transaction.types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Calendar,
  Hash,
} from "lucide-react";
import { getTransactionTitle } from "@/utils/TransactionLabels";

const TransactionItem = ({ transaction }: { transaction: TransactionResponseDTO }) => {
  const isPositive = transaction.amount > 0;

  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
      
      {/* Info principal */}
      <div className="flex gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isPositive ? <ArrowDownLeft /> : <ArrowUpRight />}
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            {getTransactionTitle(transaction.transactionType)}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(transaction.createdAt).toLocaleString("es-CO")}
            </span>

            <span className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {transaction.paymentMethod}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                transaction.transactionState === "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : transaction.transactionState === "PENDING"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {transaction.transactionState}
            </span>
          </div>

          {/* Reference */}
          {transaction.referenceId && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Ref: {transaction.referenceId}
            </p>
          )}
        </div>
      </div>

      {/* Monto */}
      <div
        className={`text-lg font-bold text-right ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {transaction.amount.toLocaleString("es-CO")}
      </div>
    </div>
  );
};

export default TransactionItem;
