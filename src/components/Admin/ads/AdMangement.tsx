'use client';

import React, { useState, useMemo } from 'react';
import { useAllAdsAdmin } from '@/hooks/ads/adminQuerys';
import { useApproveAd, useRejectAd, usePauseAdAsAdmin, useActivateAdAsAdmin, useBlockAd } from '@/hooks/ads/mutations';
import { AdForAdminDTO } from '@/types/ads/commercial';
import { AdStats } from './AdStats';
import { AdFilters } from './AdFilters';
import { AdCard } from './AdCard';
import { AdPagination } from './AdPagination';
import { RejectAdModal } from './modals/RejectAdModal';
import { BlockAdModal } from './modals/BlockAdModal';
import { ApproveAdModal } from './modals/ApproveAdModal';
import { AdDetailModal} from './AdDetailModalAdmin';
import { calculateStats, filterAds } from './utils/adHelper';

const AdManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAd, setSelectedAd] = useState<AdForAdminDTO | null>(null);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data, isLoading } = useAllAdsAdmin(currentPage, 20, statusFilter);
  const approveAdMutation = useApproveAd();
  const rejectAdMutation = useRejectAd();
  const pauseAdMutation = usePauseAdAsAdmin();
  const resumeAdMutation = useActivateAdAsAdmin();
  const blockAdMutation = useBlockAd();

  const ads = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const filteredAds = useMemo(() => filterAds(ads, searchTerm, statusFilter), [ads, searchTerm, statusFilter]);
  const stats = useMemo(() => calculateStats(ads), [ads]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleApprove = (ad: AdForAdminDTO) => {
    setSelectedAd(ad);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedAd) return;
    try {
      await approveAdMutation.mutateAsync(selectedAd.id);
      closeApproveModal();
    } catch {
      alert('Error al aprobar el anuncio');
    }
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setSelectedAd(null);
  };

  const handleReject = (ad: AdForAdminDTO) => {
    setSelectedAd(ad);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedAd || !rejectionReason.trim()) {
      alert('Debes proporcionar una razón para el rechazo');
      return;
    }
    try {
      await rejectAdMutation.mutateAsync({ id: selectedAd.id, reason: rejectionReason });
      closeRejectModal();
    } catch {
      alert('Error al rechazar el anuncio');
    }
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedAd(null);
  };

  const handleBlock = (ad: AdForAdminDTO) => {
    setSelectedAd(ad);
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!selectedAd || !blockReason.trim()) {
      alert('Debes proporcionar una razón para el bloqueo');
      return;
    }
    try {
      await blockAdMutation.mutateAsync(selectedAd.id);
      closeBlockModal();
    } catch {
      alert('Error al bloquear el anuncio');
    }
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setBlockReason('');
    setSelectedAd(null);
  };

  const handlePause = async (adId: number) => {
    try {
      await pauseAdMutation.mutateAsync(adId);
    } catch {
      alert('Error al pausar el anuncio');
    }
  };

  const handleResume = async (adId: number) => {
    try {
      await resumeAdMutation.mutateAsync(adId);
    } catch {
      alert('Error al reanudar el anuncio');
    }
  };

  const handleViewDetail = (ad: AdForAdminDTO) => {
    setSelectedAd(ad);
    setShowDetailModal(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdStats stats={stats} />

      <AdFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}
      />

      {/* Horizontal list */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <p className="text-sm">No se encontraron anuncios con los filtros actuales.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAds.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onApprove={handleApprove}
              onReject={handleReject}
              onPause={handlePause}
              onResume={handleResume}
              onBlock={handleBlock}
              onViewDetail={handleViewDetail}
              isLoading={{
                approve: approveAdMutation.isPending,
                reject: rejectAdMutation.isPending,
                pause: pauseAdMutation.isPending,
                resume: resumeAdMutation.isPending,
                block: blockAdMutation.isPending,
              }}
            />
          ))}
        </div>
      )}

      <AdPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {showApproveModal && selectedAd && (
        <ApproveAdModal
          ad={selectedAd}
          isSubmitting={approveAdMutation.isPending}
          onConfirm={confirmApprove}
          onCancel={closeApproveModal}
        />
      )}

      {showRejectModal && selectedAd && (
        <RejectAdModal
          ad={selectedAd}
          reason={rejectionReason}
          isSubmitting={rejectAdMutation.isPending}
          onReasonChange={setRejectionReason}
          onConfirm={confirmReject}
          onCancel={closeRejectModal}
        />
      )}

      {showBlockModal && selectedAd && (
        <BlockAdModal
          ad={selectedAd}
          reason={blockReason}
          isSubmitting={blockAdMutation.isPending}
          onReasonChange={setBlockReason}
          onConfirm={confirmBlock}
          onCancel={closeBlockModal}
        />
      )}

      {showDetailModal && selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          onClose={() => { setShowDetailModal(false); setSelectedAd(null); }}
        />
      )}
    </div>
  );
};

export default AdManagement;