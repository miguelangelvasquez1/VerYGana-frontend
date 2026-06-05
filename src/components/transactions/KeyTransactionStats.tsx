import { Key, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import { KeyStats } from '@/hooks/useTransactions';

const CARDS = [
    { key: 'availableKeys' as const, label: 'Llaves disponibles',  Icon: Key,         bg: 'bg-green-100',  color: 'text-green-600'  },
    { key: 'totalEarned'   as const, label: 'Total ganadas',        Icon: TrendingUp,  bg: 'bg-blue-100',   color: 'text-blue-600'   },
    { key: 'totalUsed'     as const, label: 'Total usadas',         Icon: ArrowUpRight,bg: 'bg-purple-100', color: 'text-purple-600' },
    { key: 'totalExpired'  as const, label: 'Total expiradas',      Icon: Clock,       bg: 'bg-red-100',    color: 'text-red-600'    },
];

const KeyTransactionStats = ({ stats }: { stats: KeyStats }) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CARDS.map(({ key, label, Icon, bg, color }) => (
                <div key={key} className="bg-white rounded-2xl shadow-sm p-6 border flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {(stats[key] ?? 0).toLocaleString('es-CO')}
                        </p>
                    </div>
                    <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default KeyTransactionStats;
