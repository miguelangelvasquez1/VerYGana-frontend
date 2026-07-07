import { KeyStats } from '@/hooks/useTransactions';

const CARDS = [
    { key: 'availableKeys' as const, label: 'Llaves disponibles', bg: 'bg-green-100'  },
    { key: 'totalEarned'   as const, label: 'Total ganadas',       bg: 'bg-blue-100'   },
    { key: 'totalUsed'     as const, label: 'Total usadas',        bg: 'bg-purple-100' },
    { key: 'totalExpired'  as const, label: 'Total expiradas',     bg: 'bg-red-100'    },
];

const KeyTransactionStats = ({ stats }: { stats: KeyStats }) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CARDS.map(({ key, label, bg }) => (
                <div key={key} className="bg-white rounded-2xl shadow-sm p-6 border flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {(stats[key] ?? 0).toLocaleString('es-CO')}
                        </p>
                    </div>
                    <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shrink-0`}>
                        <img src="/logos/llave.png" alt="llave" className="w-7 h-7 object-contain" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default KeyTransactionStats;
