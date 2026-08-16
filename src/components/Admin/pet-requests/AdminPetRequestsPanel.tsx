'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, PawPrint, ChevronRight, UserX } from 'lucide-react';
import {
  adminGetPetRequests,
  type PetRequest,
  type PetRequestStatus,
} from '@/services/PetRequestService';
import { AdminPetRequestDetail } from './AdminPetRequestDetail';
import { PET_STATUS_CONFIG, PET_STATUS_FILTERS, formatPetDate } from './petRequestStatus';

const AdminPetRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<PetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PetRequestStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // El filtro se resuelve en el servidor (?status=) para no traer todo y
  // descartar en el cliente; 'ALL' va sin parámetro.
  const load = useCallback(async (status: PetRequestStatus | 'ALL') => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await adminGetPetRequests(status === 'ALL' ? undefined : status));
    } catch {
      setError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  if (selectedId !== null) {
    return (
      <AdminPetRequestDetail
        requestId={selectedId}
        onBack={() => { setSelectedId(null); load(filter); }}
      />
    );
  }

  const sinAsignar = requests.filter(
    r => (r.status === 'APPROVED' || r.status === 'ITEM_IN_PROGRESS') && !r.assignedDesignerUserId,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Solicitudes de mascotas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Productos que los comercios quieren integrar al juego. Aprobar una solicitud
            implica asignarle un diseñador.
          </p>
        </div>
        <button
          onClick={() => load(filter)}
          title="Actualizar"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Aviso: aprobadas que quedaron sin diseñador no las ve nadie */}
      {sinAsignar > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <UserX size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {sinAsignar} solicitud{sinAsignar === 1 ? '' : 'es'} sin diseñador asignado
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              Mientras no tengan diseñador no aparecen en ninguna bandeja. Ábrelas y asígnalas.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {PET_STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => load(filter)} className="mt-3 text-sm text-red-600 underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <PawPrint size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {filter === 'ALL'
              ? 'Ningún comercio ha mandado un producto todavía'
              : 'No hay solicitudes con este estado'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Producto', 'Comercio', 'Estado', 'Diseñador', 'Enviada', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map(req => {
                const status = PET_STATUS_CONFIG[req.status];
                const necesitaDisenador =
                  (req.status === 'APPROVED' || req.status === 'ITEM_IN_PROGRESS') &&
                  !req.assignedDesignerUserId;
                return (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">#{req.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {req.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={req.imageUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200">
                            <PawPrint size={14} className="text-gray-300" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-900 max-w-[220px] truncate">
                          {req.productName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">
                      {req.commercialName ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {req.assignedDesignerName
                        ? <span className="text-gray-700">{req.assignedDesignerName}</span>
                        : necesitaDisenador
                        ? <span className="font-medium text-amber-600">Sin asignar</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatPetDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPetRequestsPanel;
