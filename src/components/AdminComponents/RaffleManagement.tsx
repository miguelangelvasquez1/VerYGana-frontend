// components/admin/RaffleManagement.tsx
'use client';

import React, { useState } from 'react';
import { Raffle } from '../../types/Raffle';
import { Plus, Edit, Trash2, Play, Pause, Trophy } from 'lucide-react';

const RaffleManagement: React.FC = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([
    {
      id: '1',
      title: 'iPhone 15 Pro',
      description: 'Último modelo de iPhone con todas las características premium',
      prize: 'iPhone 15 Pro Max 256GB',
      ticketPrice: 50000,
      totalTickets: 1000,
      soldTickets: 750,
      startDate: '2024-08-01',
      endDate: '2024-09-15',
      status: 'active',
      image: '/images/iphone.jpg'
    },
    {
      id: '2',
      title: 'Viaje a Europa',
      description: 'Paquete completo para 2 personas a París y Roma',
      prize: 'Viaje todo incluido por 10 días',
      ticketPrice: 100000,
      totalTickets: 500,
      soldTickets: 120,
      startDate: '2024-09-01',
      endDate: '2024-10-31',
      status: 'active'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const toggleRaffleStatus = (raffleId: string) => {
    setRaffles(raffles.map(raffle =>
      raffle.id === raffleId
        ? { ...raffle, status: raffle.status === 'active' ? 'draft' : 'active' }
        : raffle
    ));
  };

  const deleteRaffle = (raffleId: string) => {
    setRaffles(raffles.filter(raffle => raffle.id !== raffleId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Gestión de Rifas</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Rifa</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rifas</p>
              <p className="text-2xl font-semibold text-gray-900">{raffles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {raffles.filter(r => r.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded">
              <Pause className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Borradores</p>
              <p className="text-2xl font-semibold text-gray-900">
                {raffles.filter(r => r.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {raffles.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Raffles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {raffles.map((raffle) => (
          <div key={raffle.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{raffle.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  raffle.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : raffle.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {raffle.status === 'active' ? 'Activa' : 
                   raffle.status === 'draft' ? 'Borrador' : 'Completada'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{raffle.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Premio:</span>
                  <span className="font-medium">{raffle.prize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio:</span>
                  <span className="font-medium">${raffle.ticketPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vendidos:</span>
                  <span className="font-medium">{raffle.soldTickets}/{raffle.totalTickets}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{Math.round((raffle.soldTickets / raffle.totalTickets) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(raffle.soldTickets / raffle.totalTickets) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center">
                  <Edit size={14} className="mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => toggleRaffleStatus(raffle.id)}
                  className={`flex-1 py-2 px-3 rounded text-sm flex items-center justify-center ${
                    raffle.status === 'active'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {raffle.status === 'active' ? (
                    <>
                      <Pause size={14} className="mr-1" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play size={14} className="mr-1" />
                      Activar
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteRaffle(raffle.id)}
                  className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaffleManagement;