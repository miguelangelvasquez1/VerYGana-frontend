'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import ReferralPageShell from '@/components/referrals/ReferralPageShell';
import { getReferralInfo, type ReferralInfoDTO } from '@/services/ReferralService';

export default function ReferralsPage() {
  const [info, setInfo]       = useState<ReferralInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReferralInfo();
      setInfo(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
            Sistema de Referidos
          </h1>
          {info && (
            <p className="text-lg text-blue-100">
              Hola, {info.consumerName} — invita amigos y gana créditos
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-red-600">No se pudo cargar tu información: {error}</p>
          <button
            onClick={fetchInfo}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && info && (
        <ReferralPageShell info={info} />
      )}

      <div className="mb-18 lg:mb-0">
        <Footer />
      </div>
    </div>
  );
}