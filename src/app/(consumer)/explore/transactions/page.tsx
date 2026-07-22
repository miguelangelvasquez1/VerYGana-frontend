'use client';

import { useState, useEffect } from 'react';
import { useKeyTransactions } from '@/hooks/useTransactions';
import KeyTransactionStats from '@/components/transactions/KeyTransactionStats';
import KeyTransactionFilters from '@/components/transactions/KeyTransactionFilters';
import KeyTransactionList from '@/components/transactions/KeyTransactionList';

const WalletHistoryPage = () => {
    const { transactions, stats, totalPages, loading, filters, setFilters } = useKeyTransactions();
    const [animateHero, setAnimateHero] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setAnimateHero(true), 50);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">

            <header className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
                <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-16 sm:pb-24 transition-all duration-700 ${animateHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                        Historial de Llaves
                    </h1>
                    <p className="mt-4 text-white/80 max-w-2xl text-sm sm:text-base">
                        Consulta todos los movimientos de llaves de tu cuenta: ganancias, usos y expiraciones.
                    </p>
                </div>
                <div className="absolute -bottom-px left-0 right-0 leading-0">
                    <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
                    </svg>
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
