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
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No hay movimientos disponibles</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 space-y-3">

            {transactions.map(tx => {
                const positive = isPositiveKeyType(tx.type);
                const deltas = formatDelta(tx.purchaseKeysDelta, tx.connectivityKeysDelta);

                return (
                    <div
                        key={tx.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                        <div className="flex gap-4">
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                                positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                            }`}>
                                {positive
                                    ? <ArrowDownLeft className="w-5 h-5" />
                                    : <ArrowUpRight className="w-5 h-5" />
                                }
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                    {KEY_TRANSACTION_LABELS[tx.type]}
                                </p>

                                {tx.reason && (
                                    <p className="text-xs text-gray-500 mt-0.5">{tx.reason}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1.5">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(tx.createdAt).toLocaleString('es-CO')}
                                    </span>
                                    {tx.referenceId && (
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                            <Hash className="w-3 h-3" />
                                            {tx.referenceId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            {deltas.map(({ value, label }) => (
                                <p key={label} className={`text-base font-extrabold ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {value > 0 ? '+' : ''}{value.toLocaleString('es-CO')}
                                    <span className="text-xs font-medium ml-1 text-gray-400">{label}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                );
            })}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="p-2 rounded-xl bg-white shadow-md hover:shadow-lg disabled:opacity-40 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm font-semibold text-gray-600 bg-white shadow-md px-4 py-2 rounded-xl">
                        {currentPage + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage + 1 >= totalPages}
                        className="p-2 rounded-xl bg-white shadow-md hover:shadow-lg disabled:opacity-40 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            )}

        </div>
    );
};

export default KeyTransactionList;
