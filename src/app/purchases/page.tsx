"use client";

import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";
import { usePurchases } from "@/hooks/usePurchases";
import PurchaseCard from "@/components/purchases/PurchaseCard";

const PurchasesPage = () => {
  const { purchases, loading } = usePurchases();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          <h1 className="text-3xl font-bold text-gray-900">
            Mis compras
          </h1>

          {loading && <p>Cargando compras...</p>}

          {!loading && purchases.length === 0 && (
            <p className="text-gray-500">
              Aún no has realizado compras.
            </p>
          )}

          <div className="space-y-6">
            {purchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PurchasesPage;
