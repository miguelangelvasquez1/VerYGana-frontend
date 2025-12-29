'use client';

import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionStats from '@/components/transactions/TransactionStats';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionList from '@/components/transactions/TransactionList';

const TransactionHistoryPage = () => {
  const {
    transactions,
    walletBalance,
    loading,
    filters,
    setFilters,
  } = useTransactions();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* ===== HEADER ===== */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Historial de Transacciones
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
            Revisa todos los movimientos de tu monedero: depósitos, recompensas,
            compras, retiros y transferencias.
          </p>
        </div>
      </header>

      {/* ===== CONTENIDO ===== */}
      <main className="flex-1">
        {/* Stats */}
        <TransactionStats balance={walletBalance} />

        {/* Filters */}
        <TransactionFilters
          filters={filters}
          onChange={setFilters}
        />

        {/* List */}
        <TransactionList
          transactions={transactions}
          loading={loading}
        />
      </main>

      <Footer />
    </div>
  );
};

export default TransactionHistoryPage;
