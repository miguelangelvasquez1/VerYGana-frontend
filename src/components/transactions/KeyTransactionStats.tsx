import { KeyStats } from '@/hooks/useTransactions';

const CARDS = [
    { key: 'availableKeys' as const, label: 'Llaves disponibles', icon: 'bg-[#03548C]/10', value: 'text-[#03548C]' },
    { key: 'totalEarned'   as const, label: 'Total ganadas',       icon: 'bg-green-100',      value: 'text-green-600' },
    { key: 'totalUsed'     as const, label: 'Total usadas',        icon: 'bg-[#FFD700]/15',   value: 'text-[#c9a227]' },
    { key: 'totalExpired'  as const, label: 'Total expiradas',     icon: 'bg-red-100',        value: 'text-red-500' },
];

const KeyTransactionStats = ({ stats }: { stats: KeyStats }) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CARDS.map(({ key, label, icon, value }) => (
                <div key={key} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-300 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className={`text-2xl font-extrabold ${value}`}>
                            {(stats[key] ?? 0).toLocaleString('es-CO')}
                        </p>
                    </div>
                    <div className={`w-12 h-12 ${icon} rounded-full flex items-center justify-center shrink-0`}>
                        <img src="/logos/llave.png" alt="llave" className="w-7 h-7 object-contain" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default KeyTransactionStats;
