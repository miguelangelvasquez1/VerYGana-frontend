'use client';

import { useKeyTransactions } from '@/hooks/useTransactions';
import KeyTransactionStats from '@/components/transactions/KeyTransactionStats';
import KeyTransactionFilters from '@/components/transactions/KeyTransactionFilters';
import KeyTransactionList from '@/components/transactions/KeyTransactionList';

const WalletHistoryPage = () => {
    const { transactions, stats, totalPages, loading, filters, setFilters } = useKeyTransactions();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">

            <header className="bg-linear-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                        Historial de Llaves
                    </h1>
                    <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
                        Consulta todos los movimientos de llaves de tu cuenta: ganancias, usos y expiraciones.
                    </p>
                </div>
            </header>

            <main className="flex-1">
                <KeyTransactionStats stats={stats} />

                <KeyTransactionFilters filters={filters} onChange={setFilters} />

                <KeyTransactionList
                    transactions={transactions}
                    loading={loading}
                    filters={filters}
                    totalPages={totalPages}
                    onPageChange={page => setFilters(prev => ({ ...prev, page }))}
                />
            </main>

        </div>
    );
};

export default WalletHistoryPage;
