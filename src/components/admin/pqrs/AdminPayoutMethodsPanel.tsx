'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Wallet, ChevronRight, ChevronLeft, ShieldCheck, ShieldX, Landmark, Smartphone, FileText, FileX } from 'lucide-react';
import toast from 'react-hot-toast';
import { getByStatus, reject, verify } from '@/services/admin/AdminPayoutMethodService';
import { PayoutMethodResponseDTO, PayoutMethodType, VerificationStatus } from '@/types/PayoutMethod.types';
import {
  bankAccountTypeLabel,
  docTypeLabel,
  payoutMethodTypeLabel,
  verificationStatusColor,
  verificationStatusLabel,
} from '@/utils/bankDetailsMeta';
import ConfirmDialog from '@/components/generic/ConfirmDialog';
import { useAuthenticatedAssetSrc } from '@/hooks/useAuthenticatedAssetSrc';

const PAGE_SIZE = 10;

const STATUS_FILTERS: { label: string; value: VerificationStatus }[] = Object.values(VerificationStatus).map((s) => ({
  label: verificationStatusLabel[s],
  value: s,
}));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-36">{label}</span>
    <span className="text-gray-900 font-medium min-w-0 break-words">{value ?? '—'}</span>
  </div>
);

function PayoutMethodIcon({ type }: { type: PayoutMethodType }) {
  if (type === PayoutMethodType.BANK_ACCOUNT) {
    return <Landmark size={20} className="text-admin-blue" />;
  }
  return <Smartphone size={20} className="text-admin-blue" />;
}

/**
 * `certificateUrl` es una ruta propia de la API (no una URL firmada de R2)
 * que el backend autentica por JWT — igual que las imágenes privadas de
 * productos y los adjuntos de PQRS, requiere el token como query param.
 */
function CertificateLink({ certificateUrl, label, className, onClick }: {
  certificateUrl: string;
  label: string;
  className: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const src = useAuthenticatedAssetSrc(certificateUrl);

  if (!src) {
    return <span className={`${className} opacity-50`}>Cargando…</span>;
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
      <FileText size={14} />
      {label}
    </a>
  );
}

const AdminPayoutMethodsPanel: React.FC = () => {
  const [items, setItems] = useState<PayoutMethodResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus>(VerificationStatus.UNDER_REVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PayoutMethodResponseDTO | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getByStatus(statusFilter, page, PAGE_SIZE);
      setItems(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalElements(res.meta.totalElements);
    } catch {
      setError('No se pudieron cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const handleVerify = async (method: PayoutMethodResponseDTO) => {
    setVerifying(true);
    try {
      await verify(method.id);
      toast.success('Método de pago verificado');
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al verificar el método de pago');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (method: PayoutMethodResponseDTO) => {
    try {
      await reject(method.id);
      toast.success('Método de pago rechazado');
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al rechazar el método de pago');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Verificación de métodos de pago</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Revisa y aprueba los métodos de pago registrados por los comerciantes para habilitar sus pagos
          </p>
        </div>
        <button
          onClick={load}
          title="Actualizar"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(0); }}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === f.value
                ? 'bg-admin-blue text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-admin-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-600 underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <Wallet size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No hay métodos de pago con este estado</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Método', 'Titular', 'Tipo', 'Certificación', 'Estado', 'Creado', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((method) => (
                  <tr
                    key={method.id}
                    onClick={() => setSelected(method)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PayoutMethodIcon type={method.type} />
                        <p className="text-sm text-gray-700">{method.alias}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{method.accountHolderName}</p>
                      <p className="text-xs text-gray-400">{docTypeLabel[method.accountHolderDocType]} {method.accountHolderDoc}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{payoutMethodTypeLabel[method.type]}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {method.type !== PayoutMethodType.BANK_ACCOUNT ? (
                        <span className="text-xs text-gray-400">No aplica</span>
                      ) : method.certificateUrl ? (
                        <CertificateLink
                          certificateUrl={method.certificateUrl}
                          label="Ver"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-admin-blue hover:underline"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <FileX size={14} />
                          Sin adjuntar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${verificationStatusColor[method.verificationStatus]}`}>
                        {verificationStatusLabel[method.verificationStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(method.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {totalElements} método{totalElements === 1 ? '' : 's'} · Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selected.alias}</h2>
                <span className={`inline-flex mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${verificationStatusColor[selected.verificationStatus]}`}>
                  {verificationStatusLabel[selected.verificationStatus]}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 cursor-pointer">×</button>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <InfoRow label="Tipo" value={payoutMethodTypeLabel[selected.type]} />
              <InfoRow label="Titular" value={selected.accountHolderName} />
              <InfoRow label="Documento" value={`${docTypeLabel[selected.accountHolderDocType]} ${selected.accountHolderDoc}`} />
              {selected.type === PayoutMethodType.BANK_ACCOUNT ? (
                <>
                  <InfoRow label="N.º de cuenta" value={selected.accountNumber} />
                  <InfoRow
                    label="Tipo de cuenta"
                    value={selected.bankAccountType ? bankAccountTypeLabel[selected.bankAccountType as keyof typeof bankAccountTypeLabel] : undefined}
                  />
                  <InfoRow
                    label="Certificación"
                    value={
                      selected.certificateUrl ? (
                        <CertificateLink
                          certificateUrl={selected.certificateUrl}
                          label="Ver certificación bancaria"
                          className="inline-flex items-center gap-1 text-admin-blue hover:underline"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <FileX size={14} />
                          El comerciante aún no la ha enviado
                        </span>
                      )
                    }
                  />
                </>
              ) : (
                <InfoRow label="Celular" value={selected.phoneNumber} />
              )}
              <InfoRow label="Activo" value={selected.active ? 'Sí' : 'No'} />
              <InfoRow label="Primer pago realizado" value={selected.firstPayoutCompleted ? 'Sí' : 'No'} />
              <InfoRow label="Creado" value={formatDateTime(selected.createdAt)} />
              {selected.verifiedAt && <InfoRow label="Verificado" value={formatDateTime(selected.verifiedAt)} />}
              {selected.rejectionReason && <InfoRow label="Motivo de rechazo" value={selected.rejectionReason} />}
            </div>

            {selected.verificationStatus === VerificationStatus.UNDER_REVIEW && (
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setConfirmingReject(true)}
                  disabled={verifying}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShieldX size={14} />
                  Rechazar
                </button>
                <button
                  onClick={() => handleVerify(selected)}
                  disabled={verifying || (selected.type === PayoutMethodType.BANK_ACCOUNT && !selected.certificateUrl)}
                  title={
                    selected.type === PayoutMethodType.BANK_ACCOUNT && !selected.certificateUrl
                      ? 'El comerciante debe enviar la certificación bancaria antes de poder verificarse'
                      : undefined
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  Verificar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmingReject}
        title="Rechazar método de pago"
        description={selected ? `¿Seguro que quieres rechazar el método de pago "${selected.alias}"? El comerciante deberá registrar uno nuevo.` : undefined}
        confirmText="Rechazar"
        variant="danger"
        onClose={() => setConfirmingReject(false)}
        onConfirm={async () => {
          if (selected) await handleReject(selected);
          setConfirmingReject(false);
        }}
      />
    </div>
  );
};

export default AdminPayoutMethodsPanel;
