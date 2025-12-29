import { TransactionResponseDTO } from "@/types/transaction.types";
import TransactionItem from "./TransactionItem";
import { FileText } from "lucide-react";

interface Props {
  transactions: TransactionResponseDTO[];
  loading: boolean;
}

const TransactionList = ({ transactions, loading }: Props) => {
  if (loading) {
    return <p className="text-center py-16 text-gray-500">Cargando transacciones...</p>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hay transacciones disponibles</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      <div className="bg-white rounded-2xl border divide-y shadow-sm">
        {transactions.map(tx => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
