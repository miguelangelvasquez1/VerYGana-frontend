'use client';

import React, { useState, useMemo } from 'react';
import { useAllAdsAdmin } from '@/hooks/ads/adminQuerys';
import { useApproveAd, useRejectAd, usePauseAd, useResumeAd, useBlockAd } from '@/hooks/ads/mutations';
import { AdForAdminDTO } from '@/types/ads/advertiser';
import { AdStats } from './AdStats';
import { AdFilters } from './AdFilters';
import { AdCard } from './AdCard';
import { AdPagination } from './AdPagination';
import { RejectAdModal } from './modals/RejectAdModal';
import { BlockAdModal } from './modals/BlockAdModal';
import { PreviewModal } from './modals/PreviewModal';
import { calculateStats, filterAds } from './utils/adHelper';

const AdManagement: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAd, setSelectedAd] = useState<AdForAdminDTO | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);

  // React Query hooks
  const { data, isLoading } = useAllAdsAdmin(currentPage, 20, statusFilter);
  const approveAdMutation = useApproveAd();
  const rejectAdMutation = useRejectAd();
  const pauseAdMutation = usePauseAd();
  const resumeAdMutation = useResumeAd();
  const blockAdMutation = useBlockAd();

  // Computed values
  const ads = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const filteredAds = useMemo(() => filterAds(ads, searchTerm, statusFilter), [ads, searchTerm, statusFilter]);
  const stats = useMemo(() => calculateStats(ads), [ads]);

  // Handlers
  const handleApprove = async (adId: number) => {
    if (confirm('¿Estás seguro de aprobar este anuncio?')) {
      try {
        await approveAdMutation.mutateAsync(adId);
      } catch (error) {
        alert('Error al aprobar el anuncio');
      }
    }
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      alert('Error al pausar el anuncio');
    }
  };

  const handleResume = async (adId: number) => {
    try {
      await resumeAdMutation.mutateAsync(adId);
    } catch (error) {
      alert('Error al reanudar el anuncio');
    }
  };

  const handlePreview = (ad: AdForAdminDTO) => {
    if (!ad.contentUrl) return;
    setSelectedMedia({ url: ad.contentUrl, type: ad.mediaType ?? 'IMAGE' });
    setShowPreviewModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestión de Anuncios</h2>
        <p className="text-gray-600 mt-1">Administra y modera los anuncios de la plataforma</p>
      </div>

      {/* Stats */}
      <AdStats stats={stats} />

      {/* Filters */}
      <AdFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      {/* Ads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAds.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            onApprove={handleApprove}
            onReject={handleReject}
            onPause={handlePause}
            onResume={handleResume}
            onBlock={handleBlock}
            onPreview={handlePreview}
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

      {/* Pagination */}
      <AdPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
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

      {showPreviewModal && selectedMedia && (
        <PreviewModal
          url={selectedMedia.url}
          type={selectedMedia.type}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default AdManagement;