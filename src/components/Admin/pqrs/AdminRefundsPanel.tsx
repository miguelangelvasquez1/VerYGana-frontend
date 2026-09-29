'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Wallet, ChevronRight, ChevronLeft, CheckCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRefunds, markPaid } from '@/services/admin/AdminCashRefundService';
import { CashRefundResponseDTO, CashRefundStatus } from '@/types/finance/Treasury.types';
import { bankAccountTypeLabel, cashRefundStatusColor, cashRefundStatusLabel, docTypeLabel } from '@/utils/bankDetailsMeta';
import { formatPesos } from '@/utils/currency';

const PAGE_SIZE = 10;

const STATUS_FILTERS: { label: string; value: CashRefundStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  ...Object.values(CashRefundStatus).map((s) => ({ label: cashRefundStatusLabel[s], value: s })),
];

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

const AdminRefundsPanel: React.FC = () => {
  const [items, setItems] = useState<CashRefundResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CashRefundStatus | 'ALL'>(CashRefundStatus.PENDING_PAYMENT);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CashRefundResponseDTO | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRefunds(
        statusFilter === 'ALL' ? undefined : statusFilter,
        startDate || undefined,
        endDate || undefined,
        page,
        PAGE_SIZE,
      );
      setItems(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalElements(res.meta.totalElements);
    } catch {
      setError('No se pudieron cargar los reembolsos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, startDate, endDate, page]);

  const handleMarkPaid = async (refund: CashRefundResponseDTO) => {
    setMarkingPaid(true);
    try {
      await markPaid(refund.id);
      toast.success('Reembolso marcado como pagado');
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al marcar el reembolso como pagado');
    } finally {
      setMarkingPaid(false);
    }
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Reembolsos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona los reembolsos en efectivo aprobados desde reclamos de productos
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
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white"
          />
          <span className="text-gray-400 text-sm">a</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white"
          />
          {(startDate || endDate) && (
            <button onClick={clearDates} className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer">
              Limpiar
            </button>
          )}
        </div>
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
          <p className="text-gray-500 text-sm">No hay reembolsos con estos filtros</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Ítem', 'Titular', 'Monto', 'Estado', 'Creado', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((refund) => (
                  <tr
                    key={refund.id}
                    onClick={() => setSelected(refund)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">#{refund.purchaseItemId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{refund.accountHolderName || '—'}</p>
                      <p className="text-xs text-gray-400">{refund.bankName || 'Sin datos bancarios'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                      ${formatPesos(refund.amountCents)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${cashRefundStatusColor[refund.status]}`}>
                        {cashRefundStatusLabel[refund.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(refund.createdAt)}</td>
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
                {totalElements} reembolso{totalElements === 1 ? '' : 's'} · Página {page + 1} de {totalPages}
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
                <h2 className="text-lg font-semibold text-gray-800">Reembolso · Ítem #{selected.purchaseItemId}</h2>
                <span className={`inline-flex mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${cashRefundStatusColor[selected.status]}`}>
                  {cashRefundStatusLabel[selected.status]}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 cursor-pointer">×</button>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <InfoRow label="Monto" value={`$${formatPesos(selected.amountCents)}`} />
              {selected.bankDetailsSubmittedAt ? (
                <>
                  <InfoRow label="Titular" value={selected.accountHolderName} />
                  <InfoRow label="Documento" value={`${docTypeLabel[selected.accountHolderDocType]} ${selected.accountHolderDoc}`} />
                  <InfoRow label="Banco" value={selected.bankName} />
                  <InfoRow label="N.º de cuenta" value={selected.accountNumber} />
                  <InfoRow label="Tipo de cuenta" value={bankAccountTypeLabel[selected.accountType]} />
                  <InfoRow label="Datos enviados" value={formatDateTime(selected.bankDetailsSubmittedAt)} />
                </>
              ) : (
                <p className="text-sm text-gray-400">El comprador todavía no ha enviado sus datos bancarios.</p>
              )}
              {selected.paidAt && <InfoRow label="Pagado el" value={formatDateTime(selected.paidAt)} />}
            </div>

            {selected.status === CashRefundStatus.PENDING_PAYMENT && (
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleMarkPaid(selected)}
                  disabled={markingPaid || !selected.bankDetailsSubmittedAt}
                  title={!selected.bankDetailsSubmittedAt ? 'El comprador aún no envía sus datos bancarios' : undefined}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {markingPaid ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                  Marcar como pagado
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefundsPanel;
