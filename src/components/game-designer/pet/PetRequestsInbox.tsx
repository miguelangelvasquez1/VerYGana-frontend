'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, AlertTriangle, Inbox, PawPrint, ChevronRight, CheckCircle2,
} from 'lucide-react';
import {
  getGameDesignerPetRequests,
  type PetRequest,
  type PetRequestStatus,
} from '@/services/PetRequestService';
import { DesignerPetRequestDetail } from './DesignerPetRequestDetail';

const INK = '#0b1440';
const AZUL = '#00a4ff';

/**
 * La bandeja solo trae lo asignado a este diseñador, y la asignación ocurre al
 * aprobar. Por eso acá no hay PENDING ni IN_REVIEW: esos estados viven del lado
 * del admin y nunca llegan a un diseñador.
 */
const TABS: { value: PetRequestStatus | 'ALL'; label: string }[] = [
  { value: 'APPROVED',         label: 'Por empezar' },
  { value: 'ITEM_IN_PROGRESS', label: 'En curso'    },
  { value: 'COMPLETED',        label: 'Publicadas'  },
  { value: 'ALL',              label: 'Todas'       },
];

const STATUS_CFG: Record<PetRequestStatus, { label: string; bg: string; text: string }> = {
  PENDING:          { label: 'Pendiente',   bg: 'bg-yellow-100',  text: 'text-yellow-800'  },
  IN_REVIEW:        { label: 'En revisión', bg: 'bg-blue-100',    text: 'text-blue-800'    },
  APPROVED:         { label: 'Por empezar', bg: 'bg-indigo-100',  text: 'text-indigo-800'  },
  ITEM_IN_PROGRESS: { label: 'En curso',    bg: 'bg-purple-100',  text: 'text-purple-800'  },
  COMPLETED:        { label: 'Publicada',   bg: 'bg-emerald-100', text: 'text-emerald-800' },
  REJECTED:         { label: 'Rechazada',   bg: 'bg-red-100',     text: 'text-red-700'     },
};

export default function PetRequestsInbox() {
  const [tab, setTab] = useState<PetRequestStatus | 'ALL'>('APPROVED');
  const [requests, setRequests] = useState<PetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async (status: PetRequestStatus | 'ALL') => {
    setLoading(true);
    setError(false);
    try {
      setRequests(await getGameDesignerPetRequests(status === 'ALL' ? undefined : status));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  if (selectedId !== null) {
    return (
      <DesignerPetRequestDetail
        requestId={selectedId}
        onBack={() => { setSelectedId(null); load(tab); }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: INK }}>Solicitudes asignadas</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Productos que el admin te asignó para convertir en ítems del catálogo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(tab)}
          className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          title="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map(({ value, label }) => {
          const active = value === tab;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={active ? { color: INK } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: AZUL }} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-red-500">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">No se pudieron cargar las solicitudes.</p>
          <button
            type="button"
            onClick={() => load(tab)}
            className="cursor-pointer text-xs hover:underline"
            style={{ color: AZUL }}
          >
            Reintentar
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-gray-400">
          <Inbox className="h-10 w-10" />
          <p className="text-sm font-medium text-gray-500">
            {tab === 'APPROVED'
              ? 'No tienes solicitudes por empezar'
              : tab === 'COMPLETED'
              ? 'Todavía no has publicado ningún ítem'
              : 'Nada por aquí'}
          </p>
          <p className="max-w-xs text-xs">
            El admin asigna las solicitudes al aprobarlas. Cuando te toque una, aparece acá.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pb-4">
          {requests.map(req => {
            const cfg = STATUS_CFG[req.status];
            return (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedId(req.id)}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                {req.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={req.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200">
                    <PawPrint className="h-5 w-5 text-gray-300" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{req.productName}</p>
                      {req.commercialName && (
                        <p className="mt-0.5 text-xs text-gray-400">{req.commercialName}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{req.description}</p>
                  {req.status === 'COMPLETED' && req.resultCatalogItemId && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Ítem #{req.resultCatalogItemId}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
