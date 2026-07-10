"use client";

import { Loader2, Package, ShoppingBag } from "lucide-react";
import { usePurchases } from "@/hooks/usePurchases";
import PurchaseCard from "@/components/purchases/PurchaseCard";

const PurchasesPage = () => {
  const { purchases, loading } = usePurchases();

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 lg:pb-0">

      {/* HERO */}
      <header className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ShoppingBag className="w-3.5 h-3.5" />
            Historial de compras
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Mis compras
          </h1>
          <p className="text-white/70 text-sm max-w-md">
            Consulta el estado de tus pedidos, los productos adquiridos y el detalle de cada pago.
          </p>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#03548C]" />
            <p className="text-sm">Cargando compras...</p>
          </div>
        )}

        {!loading && purchases.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">Aún no has realizado compras</p>
            <p className="text-sm text-gray-400 mt-1">Cuando compres un producto, aparecerá aquí.</p>
          </div>
        )}

        {!loading && purchases.length > 0 && (
          <div className="flex flex-col gap-4">
            {purchases.map((purchase) => (
              <PurchaseCard key={purchase.id} purchase={purchase} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchasesPage;
