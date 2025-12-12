// components/ads/AdsList.tsx
'use client';

import React, { useState } from 'react';
import { AdCard } from './AdCard';
import { Search, Filter, Plus, FileImage, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AdResponseDTO } from '@/types/advertiser';
import { useAds } from '@/hooks/useAds';
import { adService } from '@/services/adService';
import { EditAdModal } from './EditAdModal';

export function AdsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize] = useState(12);
  const [editingAd, setEditingAd] = useState<AdResponseDTO | null>(null);
  
  const { ads, loading, error, totalPages, totalElements, currentPage, refetch, goToPage } = useAds(0, pageSize);

  const filteredAds = (ads || []).filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (ad: AdResponseDTO) => {
    setEditingAd(ad);
  };

  const handleCloseModal = () => {
    setEditingAd(null);
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const handlePause = async (adId: number) => {
    try {
      await adService.pauseAd(adId);
      refetch();
    } catch (err) {
      console.error('Error al pausar anuncio:', err);
      alert('Error al pausar el anuncio');
    }
  };

  const handleResume = async (adId: number) => {
    try {
      await adService.resumeAd(adId);
      refetch();
    } catch (err) {
      console.error('Error al reanudar anuncio:', err);
      alert('Error al reanudar el anuncio');
    }
  };

  const handleDelete = async (adId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.')) {
      try {
        await adService.deleteAd(adId);
        refetch();
      } catch (err) {
        console.error('Error al eliminar anuncio:', err);
        alert('Error al eliminar el anuncio');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">Error al cargar los anuncios: {error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar anuncios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="active">Activos</option>
                <option value="paused">Pausados</option>
                <option value="completed">Completados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>

          {/* Botón crear anuncio */}
          <Link
            href="/advertiser/ads/create"
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Anuncio
          </Link>
        </div>
      </div>

      {/* Resumen de estadísticas - 🔥 También protege aquí */}
      {ads && ads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total Anuncios</p>
            <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Presupuesto Total</p>
            <p className="text-2xl font-bold text-blue-600">
              ${ads.reduce((sum, ad) => sum + Number(ad.totalBudget), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Gastado</p>
            <p className="text-2xl font-bold text-green-600">
              ${ads.reduce((sum, ad) => sum + Number(ad.spentBudget), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Likes Totales</p>
            <p className="text-2xl font-bold text-purple-600">
              {ads.reduce((sum, ad) => sum + (ad.currentLikes || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Lista de anuncios */}
      {filteredAds.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={handleEdit}
                onPause={handlePause}
                onResume={handleResume}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage + 1} de {totalPages}
              </span>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FileImage className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron anuncios</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primer anuncio para comenzar'
            }
          </p>
          <Link
            href="/advertiser/ads/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Anuncio
          </Link>
        </div>
      )}
    </div>
    {/* Modal de edición */}
      {editingAd && (
        <EditAdModal
          ad={editingAd}
          isOpen={!!editingAd}
          onClose={handleCloseModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}