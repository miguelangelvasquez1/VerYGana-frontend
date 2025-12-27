'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  getConsumerEarnings,
  countTransactionsByType,
} from '@/services/TransactionService';

interface Props {
  balance: number;
}

const TransactionStats = ({ balance }: Props) => {
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [totalPrizes, setTotalPrizes] = useState<number>(0);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          earnings,
          prizes,
          deposits,
        ] = await Promise.all([
          getConsumerEarnings(),
          countTransactionsByType('RAFFLE_PRIZE'),
          countTransactionsByType('DEPOSIT'),
        ]);

        setTotalEarnings(earnings);
        setTotalPrizes(prizes);
        setTotalDeposits(deposits);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Saldo */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Saldo disponible
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {balance.toLocaleString()} Tpoints
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Ganancias */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Ganancias totales
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '—' : totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Premios */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Premios ganados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '—' : totalPrizes}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Depósitos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Depósitos realizados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '—' : totalDeposits}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionStats;
