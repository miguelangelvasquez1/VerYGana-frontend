import { Check, Clock, MessageSquare, Phone, Star, Wifi } from "lucide-react";

// Componente para tarjeta de plan
type Plan = {
  id: string;
  operator: string;
  operatorColor: string;
  operatorLogo: string;
  name: string;
  type: string;
  price: number;
  originalPrice: number;
  minutes: string;
  data: string;
  sms: string;
  validity: string;
  features: string[];
  isPopular: boolean;
  discount: number;
  rating: number;
  reviews: number;
};

export const PlanCard = ({ plan }: { plan: Plan }) => {
  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === "string" ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const getOperatorColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: 'border-red-500 bg-red-50',
      blue: 'border-blue-500 bg-blue-50',
      green: 'border-green-500 bg-green-50'
    };
    return colors[color] || 'border-gray-500 bg-gray-50';
  };

  return (
    <div className="relative bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 shadow-sm hover:shadow-lg transition-all duration-300">
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
            Más Popular
          </span>
        </div>
      )}
      
      {plan.discount > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          -{plan.discount}%
        </div>
      )}

      <div className="p-6">
        {/* Header del operador */}
        <div className={`flex items-center justify-center p-3 rounded-lg mb-4 ${getOperatorColor(plan.operatorColor)}`}>
          <div className="text-center">
            <h3 className="font-bold text-lg text-gray-900">{plan.operator}</h3>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              plan.type === 'postpago' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {plan.type === 'postpago' ? 'Postpago' : 'Prepago'}
            </span>
          </div>
        </div>

        <h4 className="font-bold text-lg mb-3 text-center">{plan.name}</h4>

        {/* Precio */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-blue-600">{formatPrice(plan.price)}</span>
            {plan.originalPrice > plan.price && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(plan.originalPrice)}</span>
            )}
          </div>
          <span className="text-sm text-gray-500">por mes</span>
        </div>

        {/* Características principales */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Minutos</span>
            </div>
            <span className="font-semibold text-gray-900">{plan.minutes}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <Wifi className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Datos</span>
            </div>
            <span className="font-semibold text-gray-900">{plan.data}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">SMS</span>
            </div>
            <span className="font-semibold text-gray-900">{plan.sms}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Vigencia</span>
            </div>
            <span className="font-semibold text-gray-900">{plan.validity}</span>
          </div>
        </div>

        {/* Características adicionales */}
        <div className="mb-6">
          <h5 className="font-semibold text-sm text-gray-700 mb-2">Incluye:</h5>
          <div className="space-y-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{plan.rating}</span>
            <span className="text-sm text-gray-500 ml-1">({plan.reviews} reseñas)</span>
          </div>
        </div>

        {/* Botón de acción */}
        <button className={`w-full py-3 px-4 rounded-lg font-bold transition-colors duration-200 ${
          plan.isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}>
          Contratar Plan
        </button>
      </div>
    </div>
  );
};