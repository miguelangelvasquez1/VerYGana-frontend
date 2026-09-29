'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Landmark, Smartphone, ChevronLeft, ChevronRight, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAll, setDefault } from '@/services/commercial/PayoutMethodService';
import { PayoutMethodResponseDTO, PayoutMethodType, VerificationStatus } from '@/types/PayoutMethod.types';
import { PagedResponse } from '@/types/Generic.types';
import { docTypeLabel, payoutMethodTypeLabel, verificationStatusColor, verificationStatusLabel } from '@/utils/bankDetailsMeta';
import { CreatePayoutMethodModal } from './CreatePayoutMethodModal';
import { VerifyOtpModal } from './VerifyOtpModal';

const canVerifyOtp = (m: PayoutMethodResponseDTO) =>
  m.type !== PayoutMethodType.BANK_ACCOUNT && m.verificationStatus === VerificationStatus.AWAITING_OTP;

const canSetDefault = (m: PayoutMethodResponseDTO) =>
  m.verificationStatus === VerificationStatus.VERIFIED && !m.defaultMethod;

const PAGE_SIZE = 10;

function PayoutMethodIcon({ type }: { type: PayoutMethodType }) {
  if (type === PayoutMethodType.BANK_ACCOUNT) {
    return <Landmark className="w-4 h-4 text-[#03548C]" />;
  }
  return <Smartphone className="w-4 h-4 text-[#03548C]" />;
}

export function PayoutMethodsSection() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PagedResponse<PayoutMethodResponseDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyingMethod, setVerifyingMethod] = useState<PayoutMethodResponseDTO | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const load = (p: number) => {
    setLoading(true);
    setError(false);
    getAll(p, PAGE_SIZE)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleCreated = () => {
    setShowCreateModal(false);
    setPage(0);
    load(0);
  };

  const handleSetDefault = async (m: PayoutMethodResponseDTO) => {
    setSettingDefaultId(m.id);
    try {
      await setDefault(m.id);
      toast.success('Método de pago predeterminado actualizado');
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al establecer el método predeterminado');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Métodos de pago</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#03548C] hover:bg-[#024270] px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Agregar método de pago
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm text-red-500">Error al cargar los métodos de pago.</p>
          <button onClick={() => load(page)} className="text-sm text-[#03548C] hover:underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : !data?.data?.length ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Aún no tienes métodos de pago registrados.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#03548C]/10 shrink-0">
                    <PayoutMethodIcon type={m.type} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.alias}</p>
                      {m.defaultMethod && (
                        <span
                          title="Aquí recibirás tus pagos diarios"
                          className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Predeterminado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {payoutMethodTypeLabel[m.type]}
                      {m.accountNumber ? ` · ${m.accountNumber}` : ''}
                      {m.phoneNumber ? ` · ${m.phoneNumber}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {m.accountHolderName} · {docTypeLabel[m.accountHolderDocType]} {m.accountHolderDoc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!m.active && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Inactivo
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationStatusColor[m.verificationStatus]}`}>
                    {verificationStatusLabel[m.verificationStatus]}
                  </span>
                  {canVerifyOtp(m) && (
                    <button
                      onClick={() => setVerifyingMethod(m)}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-[#03548C] hover:bg-[#024270] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verificar código
                    </button>
                  )}
                  {canSetDefault(m) && (
                    <button
                      onClick={() => handleSetDefault(m)}
                      disabled={settingDefaultId === m.id}
                      className="flex items-center gap-1 text-xs font-medium text-[#03548C] border border-[#03548C]/30 hover:bg-[#03548C]/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {settingDefaultId === m.id ? 'Actualizando...' : 'Establecer como predeterminado'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {data.meta.totalElements} registros · Página {data.meta.page + 1} de {Math.max(data.meta.totalPages, 1)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!data.meta.hasPrevious}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.meta.hasNext}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreatePayoutMethodModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {verifyingMethod && (
        <VerifyOtpModal
          method={verifyingMethod}
          onClose={() => setVerifyingMethod(null)}
          onVerified={() => {
            setVerifyingMethod(null);
            load(page);
          }}
        />
      )}
    </div>
  );
}
