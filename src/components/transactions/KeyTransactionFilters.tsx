'use client';

import { Filter } from "lucide-react";
import { KeyTxFilters } from "@/hooks/useTransactions";
import { KEY_TRANSACTION_LABELS, KeyTransactionType } from "@/types/KeyTransaction.types";

interface Props {
    filters: KeyTxFilters;
    onChange: (filters: KeyTxFilters) => void;
}

const inputClass = "px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-[#03548C] transition";

const KeyTransactionFilters = ({ filters, onChange }: Props) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-6 space-y-4">

            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#03548C]/10 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-[#03548C]" />
                </div>
                <h2 className="font-bold text-gray-800">Filtros</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Desde</label>
                    <input
                        type="date"
                        value={filters.initialDate ?? ''}
                        onChange={e => onChange({ ...filters, initialDate: e.target.value || undefined, page: 0 })}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hasta</label>
                    <input
                        type="date"
                        value={filters.endDate ?? ''}
                        onChange={e => onChange({ ...filters, endDate: e.target.value || undefined, page: 0 })}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo de movimiento</label>
                    <select
                        value={filters.type ?? ''}
                        onChange={e => onChange({ ...filters, type: (e.target.value as KeyTransactionType) || undefined, page: 0 })}
                        className={inputClass}
                    >
                        <option value="">Todos los tipos</option>
                        {Object.entries(KEY_TRANSACTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Registros por página</label>
                    <select
                        value={filters.size ?? 20}
                        onChange={e => onChange({ ...filters, size: Number(e.target.value), page: 0 })}
                        className={inputClass}
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
