// components/ads/AdsList.tsx
'use client';

import React, { useState } from 'react';
import { AdCard } from './AdCard';
import { Search, Filter, Plus, FileImage } from 'lucide-react';
import Link from 'next/link';
import { Ad } from '@/types/advertiser';

export function AdsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Datos de ejemplo
  const ads: Ad[] = [
    {
      id: '1',
      title: 'Promoción Black Friday',
      description: 'Grandes descuentos en toda nuestra línea de productos',
      type: 'image',
      fileUrl: '/api/placeholder/400/300',
      status: 'active',
      createdAt: new Date('2024-11-01'),
      budget: 500,
      spent: 245.80,
      impressions: 15430,
      clicks: 847,
      ctr: 5.49,
      cpc: 0.29,
      targetAudience: {
        ageRange: [25, 45],
        gender: 'all',
        interests: ['shopping', 'fashion'],
        location: ['Colombia', 'Medellín']
      }
    },
    {
      id: '2',
      title: 'Producto Verano',
      description: 'Nueva colección de verano disponible',
      type: 'video',
      fileUrl: '/api/placeholder/400/300',
      status: 'paused',
      createdAt: new Date('2024-10-15'),
      budget: 300,
      spent: 123.45,
      impressions: 8920,
      clicks: 267,
      ctr: 2.99,
      cpc: 0.46,
      targetAudience: {
        ageRange: [18, 35],
        gender: 'female',
        interests: ['fashion', 'lifestyle'],
        location: ['Colombia']
      }
    },
    {
      id: '3',
      title: 'Lanzamiento App Móvil',
      description: 'Descarga nuestra nueva aplicación móvil',
      type: 'image',
      fileUrl: '/api/placeholder/400/300',
      status: 'pending',
      createdAt: new Date('2024-11-06'),
      budget: 750,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      targetAudience: {
        ageRange: [20, 50],
        gender: 'all',
        interests: ['technology', 'mobile'],
        location: ['Colombia', 'Bogotá', 'Medellín']
      }
    }
  ];

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (ad: Ad) => {
    console.log('Editar anuncio:', ad);
  };

  const handlePause = (adId: string) => {
    console.log('Pausar anuncio:', adId);
  };

  const handleResume = (adId: string) => {
    console.log('Reanudar anuncio:', adId);
  };

  const handleDelete = (adId: string) => {
    console.log('Eliminar anuncio:', adId);
  };

  return (
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
                <option value="active">Activos</option>
                <option value="paused">Pausados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>

          {/* Botón crear anuncio */}
          <Link
            href="/advertiser/ads/create"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Anuncio
          </Link>
        </div>
      </div>

      {/* Lista de anuncios */}
      {filteredAds.length > 0 ? (
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
            href="/ads/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Anuncio
          </Link>
        </div>
      )}
    </div>
  );
}
