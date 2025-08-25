import { CreditCard, Wifi, Zap, Phone, Clock, Check } from "lucide-react";

// Componente para tarjeta de recarga
type Recharge = {
  id: string;
  operator: string;
  operatorColor: string;
  operatorLogo: string;
  type: string;
  amount: number;
  bonus?: number;
  validity: string;
  features: string[];
  data?: string;
  minutes?: string;
};

export const RechargeCard = ({ recharge }: { recharge: Recharge }) => {
  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === "string" ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const getTypeColor = (type: "saldo" | "datos" | "combo" | string) => {
    const colors: Record<"saldo" | "datos" | "combo", string> = {
      saldo: 'bg-green-100 text-green-800',
      datos: 'bg-blue-100 text-blue-800',
      combo: 'bg-purple-100 text-purple-800'
    };
    return colors[type as "saldo" | "datos" | "combo"] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof CreditCard> = {
      saldo: CreditCard,
      datos: Wifi,
      combo: Zap
    };
    const Icon = icons[type] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  const getOperatorColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'border-red-200',
      blue: 'border-blue-200',
      green: 'border-green-200'
    };
    return colors[color] || 'border-gray-200';
  };

  return (
    <div className={`bg-white rounded-xl border-2 ${getOperatorColor(recharge.operatorColor)} hover:shadow-lg transition-all duration-300`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="font-bold text-lg text-gray-900">{recharge.operator}</h3>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(recharge.type)}`}>
            {getTypeIcon(recharge.type)}
            <span className="ml-1 capitalize">{recharge.type}</span>
          </span>
        </div>

        {/* Precio principal */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(recharge.amount)}</span>
          {recharge.bonus && (
            <div className="text-sm text-green-600 font-medium">
              + {formatPrice(recharge.bonus)} de bono
            </div>
          )}
        </div>

        {/* Detalles específicos por tipo */}
        <div className="space-y-2 mb-4">
          {recharge.data && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Datos</span>
              </div>
              <span className="font-semibold text-gray-900">{recharge.data}</span>
            </div>
          )}

          {recharge.minutes && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Minutos</span>
              </div>
              <span className="font-semibold text-gray-900">{recharge.minutes}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Vigencia</span>
            </div>
            <span className="font-semibold text-gray-900">{recharge.validity}</span>
          </div>
        </div>

        {/* Características */}
        <div className="mb-4">
          <div className="space-y-1">
            {recharge.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Botón */}
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
          Recargar Ahora
        </button>
      </div>
    </div>
  );
};