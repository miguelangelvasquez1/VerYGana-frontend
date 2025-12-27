import { Filter, Search } from "lucide-react";

interface Filters {
  type?: string;
  state?: string;
  reference?: string;
  page?: number;
  size?: number;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const TransactionFilters = ({ filters, onChange }: Props) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filtros</h2>
        </div>

        {/* 🔍 Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código de referencia"
            value={filters.reference ?? ""}
            onChange={(e) =>
              onChange({
                reference: e.target.value || undefined,
                page: 0,
                size: filters.size,
              })
            }
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selectores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Tipo */}
          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                type: e.target.value || undefined,
                page: 0,
              })
            }
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="DEPOSIT">Depósitos</option>
            <option value="POINTS_AD_LIKE_REWARD">Recompensas por ver anuncios</option>
            <option value="POINTS_GAME_PLAYED">Recompensas por jugar juegos</option>
            <option value="RAFFLE_PRIZE">Premios ganados en rifas</option>
            <option value="WHOLE_PURCHASE">Compras</option>
            <option value="RAFFLE_PARTICIPATION">Participación en rifas</option>
            <option value="DATA_RECHARGE">Compras de paquetes de datos</option>
            <option value="GIFT_TRANSFER_SENT">Transferencias enviadas</option>
            <option value="GIFT_TRANSFER_RECEIVED">Transferencias recibidas</option>
          </select>

          {/* Estado */}
          <select
            value={filters.state ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                state: e.target.value || undefined,
                page: 0,
              })
            }
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="COMPLETED">Completadas</option>
            <option value="PENDING">Pendientes</option>
            <option value="FAILED">Fallidas</option>
          </select>

          {/* Tamaño */}
          <select
            value={filters.size ?? 10}
            onChange={(e) =>
              onChange({
                ...filters,
                size: Number(e.target.value),
                page: 0,
              })
            }
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
