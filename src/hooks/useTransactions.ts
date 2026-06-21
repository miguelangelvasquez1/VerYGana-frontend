import { useEffect, useState } from "react";
import {
    getMyKeyTransactions,
    getTotalEarnedKeys,
    getTotalUsedKeys,
    getTotalExpiredKeys,
    KeyTxParams,
} from "@/services/KeyTransactionService";
import { getConsumerAvailableKeys } from "@/services/ConsumerService";
import { KeyTransactionResponseDTO } from "@/types/KeyTransaction.types";

export type KeyTxFilters = KeyTxParams;

export interface KeyStats {
    availableKeys: number;
    totalEarned: number;
    totalUsed: number;
    totalExpired: number;
}

export const useKeyTransactions = () => {
    const [transactions, setTransactions] = useState<KeyTransactionResponseDTO[]>([]);
    const [stats, setStats] = useState<KeyStats>({ availableKeys: 0, totalEarned: 0, totalUsed: 0, totalExpired: 0 });
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<KeyTxFilters>({ page: 0, size: 20 });

    useEffect(() => {
        Promise.all([
            getConsumerAvailableKeys(),
            getTotalEarnedKeys(),
            getTotalUsedKeys(),
            getTotalExpiredKeys(),
        ])
            .then(([available, earned, used, expired]) =>
                setStats({ availableKeys: available, totalEarned: earned, totalUsed: used, totalExpired: expired })
            )
            .catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        getMyKeyTransactions(filters)
            .then(res => {
                setTransactions(res.data);
                setTotalPages(res.meta.totalPages);
            })
            .catch(() => setTransactions([]))
            .finally(() => setLoading(false));
    }, [filters]);

    return { transactions, stats, totalPages, loading, filters, setFilters };
};
