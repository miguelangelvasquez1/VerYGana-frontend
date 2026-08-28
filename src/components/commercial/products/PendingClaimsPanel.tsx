'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, PackageCheck, PackageSearch, Search, X } from 'lucide-react';
import { getPendingClaims } from '@/services/PurchaseItemService';
import { CommercialPendingClaimResponseDTO } from '@/types/purchases/purchaseItem.types';
import { DocumentType } from '@/types/User.types';
import ClaimPinModal from './ClaimPinModal';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.CC]: 'Cédula de ciudadanía',
  [DocumentType.CE]: 'Cédula de extranjería',
  [DocumentType.PP]: 'Pasaporte',
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (!iso || isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

export default function PendingClaimsPanel() {
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.CC);
  const [documentNumber, setDocumentNumber] = useState('');
  const [appliedDocumentNumber, setAppliedDocumentNumber] = useState('');

  const [claims, setClaims] = useState<CommercialPendingClaimResponseDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimTarget, setClaimTarget] = useState<CommercialPendingClaimResponseDTO | null>(null);
  const hasLoaded = useRef(false);

  const loadClaims = useCallback(async (docType: DocumentType, docNumber: string, targetPage: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = docNumber
        ? await getPendingClaims(docType, docNumber, targetPage, 10)
        : await getPendingClaims(undefined, undefined, targetPage, 10);
      setClaims(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar las entregas pendientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadClaims(documentType, '', 0);
  }, [documentType, loadClaims]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = documentNumber.trim();
    setAppliedDocumentNumber(trimmed);
    setPage(0);
    loadClaims(documentType, trimmed, 0);
  };

  const handleClearFilter = () => {
    setDocumentNumber('');
    setAppliedDocumentNumber('');
    setPage(0);
    loadClaims(documentType, '', 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadClaims(documentType, appliedDocumentNumber, newPage);
  };

  const handleClaimed = () => {
    setClaimTarget(null);
    loadClaims(documentType, appliedDocumentNumber, page);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Entregas pendientes</h2>

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
          >
            {Object.values(DocumentType).map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Número de documento del comprador (opcional)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Filtrar por documento..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-[#03548C] text-white rounded-lg font-semibold text-sm hover:bg-[#0b1440] transition disabled:opacity-50 cursor-pointer"
        >
          Buscar
        </button>

        {appliedDocumentNumber && (
          <button
            type="button"
            onClick={handleClearFilter}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtro
          </button>
        )}
      </form>

      {isLoading && claims.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadClaims(documentType, appliedDocumentNumber, page)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <PackageSearch className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            {appliedDocumentNumber
              ? 'Este comprador no tiene productos físicos pendientes por entregar'
              : 'No tienes productos físicos pendientes por entregar'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Producto', 'Comprador', 'Documento', 'Precio', 'Fecha de compra', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={claim.imageUrl}
                        alt={claim.productName}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                      />
                      <p className="text-sm font-medium text-gray-900">{claim.productName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{claim.buyerName}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {DOCUMENT_TYPE_LABELS[claim.documentType]} {claim.documentNumber}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#03548C]">
                    {formatPrice(claim.unitPriceCents)}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{formatDate(claim.purchasedAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      title="Entregar producto"
                      onClick={() => setClaimTarget(claim)}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Entregar producto
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-500">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {claimTarget && (
        <ClaimPinModal
          item={claimTarget}
          onClose={() => setClaimTarget(null)}
          onClaimed={handleClaimed}
        />
      )}
    </div>
  );
}
