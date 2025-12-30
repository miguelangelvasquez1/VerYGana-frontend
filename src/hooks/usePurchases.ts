import { useEffect, useState } from "react";
import { purchaseService } from "@/services/PurchaseService";
import { PurchaseResponseDTO } from "@/types/purchases/purchase.types";

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<PurchaseResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseService.getPurchases(page, size);
      setPurchases(response.data);
    } catch (e) {
      console.error("Error cargando compras", e);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, size]);

  return {
    purchases,
    loading,
    page,
    setPage,
  };
};
