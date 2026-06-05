'use client';

import { Filter } from "lucide-react";
import { KeyTxFilters } from "@/hooks/useTransactions";
import { KEY_TRANSACTION_LABELS, KeyTransactionType } from "@/types/KeyTransaction.types";

interface Props {
    filters: KeyTxFilters;
    onChange: (filters: KeyTxFilters) => void;
}

const KeyTransactionFilters = ({ filters, onChange }: Props) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">

            <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Filtros</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Desde</label>
                    <input
                        type="date"
                        value={filters.initialDate ?? ''}
                        onChange={e => onChange({ ...filters, initialDate: e.target.value || undefined, page: 0 })}
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Hasta</label>
                    <input
                        type="date"
                        value={filters.endDate ?? ''}
                        onChange={e => onChange({ ...filters, endDate: e.target.value || undefined, page: 0 })}
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Tipo de movimiento</label>
                    <select
                        value={filters.type ?? ''}
                        onChange={e => onChange({ ...filters, type: (e.target.value as KeyTransactionType) || undefined, page: 0 })}
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los tipos</option>
                        {Object.entries(KEY_TRANSACTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Registros por página</label>
                    <select
                        value={filters.size ?? 20}
                        onChange={e => onChange({ ...filters, size: Number(e.target.value), page: 0 })}
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={10}>10 por página</option>
                        <option value={20}>20 por página</option>
                        <option value={50}>50 por página</option>
                    </select>
                </div>

            </div>
        </div>
    </div>
);

export default KeyTransactionFilters;
