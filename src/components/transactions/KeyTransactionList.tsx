import { FileText, ArrowDownLeft, ArrowUpRight, Calendar, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import { KeyTransactionResponseDTO, KEY_TRANSACTION_LABELS, isPositiveKeyType } from "@/types/KeyTransaction.types";
import { KeyTxFilters } from "@/hooks/useTransactions";

interface Props {
    transactions: KeyTransactionResponseDTO[];
    loading: boolean;
    filters: KeyTxFilters;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const formatDelta = (purchase: number | null | undefined, connectivity: number | null | undefined) => {
    const p = purchase ?? 0;
    const c = connectivity ?? 0;
    const parts: { value: number; label: string }[] = [];
    if (p !== 0) parts.push({ value: p, label: 'compra' });
    if (c !== 0) parts.push({ value: c, label: 'conex.' });
    return parts.length > 0 ? parts : [{ value: 0, label: 'llaves' }];
};

const KeyTransactionList = ({ transactions, loading, filters, totalPages, onPageChange }: Props) => {
    const currentPage = filters.page ?? 0;

    if (loading) {
        return <p className="text-center py-16 text-gray-500">Cargando movimientos...</p>;
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-20">
                <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay movimientos disponibles</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 space-y-4">

            <div className="bg-white rounded-2xl border divide-y shadow-sm">
                {transactions.map(tx => {
                    const positive = isPositiveKeyType(tx.type);
                    const deltas = formatDelta(tx.purchaseKeysDelta, tx.connectivityKeysDelta);

                    return (
                        <div key={tx.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition">

                            <div className="flex gap-4">
                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {positive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>

                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {KEY_TRANSACTION_LABELS[tx.type]}
                                    </p>

                                    {tx.reason && (
                                        <p className="text-sm text-gray-500 mt-0.5">{tx.reason}</p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(tx.createdAt).toLocaleString('es-CO')}
                                        </span>
                                        {tx.referenceId && (
                                            <span className="flex items-center gap-1">
                                                <Hash className="w-3 h-3" />
                                                {tx.referenceId}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                {deltas.map(({ value, label }) => (
                                    <p key={label} className={`text-base font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {value > 0 ? '+' : ''}{value.toLocaleString('es-CO')} {label}
                                    </p>
                                ))}
                            </div>

                        </div>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="p-2 rounded-lg border bg-white shadow-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage + 1} de {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage + 1 >= totalPages}
                        className="p-2 rounded-lg border bg-white shadow-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

        </div>
    );
};

export default KeyTransactionList;
