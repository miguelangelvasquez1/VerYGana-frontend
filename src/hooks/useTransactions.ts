import { useEffect, useState } from "react";
import {
  getTransactionsByFilter,
  getByReferenceCode,
} from "@/services/TransactionService";
import { getMyWallet } from "@/services/WalletService";
import { TransactionResponseDTO } from "@/types/transaction.types";

interface Filters {
  type?: string;
  state?: string;
  reference?: string;
  page?: number;
  size?: number;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    page: 0,
    size: 10,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const walletPromise = getMyWallet();

      let txResponse;

      // 🔍 BÚSQUEDA POR REFERENCIA
      if (filters.reference && filters.reference.trim() !== "") {
        txResponse = await getByReferenceCode(
          filters.reference,
          filters.page,
          filters.size
        );
      }
      // 📄 LISTADO NORMAL
      else {
        txResponse = await getTransactionsByFilter(filters);
      }

      const wallet = await walletPromise;

      setTransactions(txResponse.data);
      setWalletBalance(wallet.balance);
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  return {
    transactions,
    walletBalance,
    loading,
    filters,
    setFilters,
  };
};
