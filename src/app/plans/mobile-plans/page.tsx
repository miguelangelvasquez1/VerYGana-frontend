'use client';

import { useState, useEffect } from "react";
import { 
  Smartphone, 
  Wifi, 
  Phone, 
  MessageSquare, 
  Zap, 
  CreditCard, 
  Check, 
  Star,
  Filter,
  Search,
  ChevronDown,
  Signal,
  Clock,
  ShoppingCart
} from "lucide-react";
import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";
import { PlanCard } from "@/components/PlansPage/PlanCard";
import { RechargeCard } from "@/components/PlansPage/RechargeCard";

// Datos de planes móviles
const mobilePlans = [
  {
    id: "1",
    operator: "Claro",
    operatorColor: "red",
    operatorLogo: "/operators/claro.png",
    name: "Plan Claro Max",
    type: "postpago",
    price: 89000,
    originalPrice: 99000,
    minutes: "Ilimitados",
    data: "20GB",
    sms: "Ilimitados",
    validity: "30 días",
    features: ["5G", "Roaming", "Netflix incluido", "Spotify Premium"],
    isPopular: true,
    discount: 10,
    rating: 4.6,
    reviews: 234
  },
  {
    id: "2",
    operator: "Movistar",
    operatorColor: "blue",
    operatorLogo: "/operators/movistar.png",
    name: "Plan Movistar Libre",
    type: "postpago",
    price: 75000,
    originalPrice: 75000,
    minutes: "Ilimitados",
    data: "15GB",
    sms: "Ilimitados",
    validity: "30 días",
    features: ["4G+", "WhatsApp gratis", "Redes sociales gratis"],
    isPopular: false,
    discount: 0,
    rating: 4.3,
    reviews: 189
  },
  {
    id: "3",
    operator: "Tigo",
    operatorColor: "blue",
    operatorLogo: "/operators/tigo.png",
    name: "Plan Tigo Control",
    type: "prepago",
    price: 35000,
    originalPrice: 40000,
    minutes: "300 min",
    data: "8GB",
    sms: "100 SMS",
    validity: "30 días",
    features: ["4G", "Facebook gratis", "WhatsApp gratis"],
    isPopular: false,
    discount: 12,
    rating: 4.1,
    reviews: 156
  },
  {
    id: "4",
    operator: "ETB",
    operatorColor: "green",
    operatorLogo: "/operators/etb.png",
    name: "Plan ETB Hogar",
    type: "postpago",
    price: 65000,
    originalPrice: 65000,
    minutes: "Ilimitados",
    data: "12GB",
    sms: "Ilimitados",
    validity: "30 días",
    features: ["4G", "Llamadas locales gratis", "WiFi gratis en centros comerciales"],
    isPopular: false,
    discount: 0,
    rating: 4.0,
    reviews: 98
  }
];

// Datos de recargas
const recharges = [
  {
    id: "r1",
    operator: "Claro",
    operatorColor: "red",
    operatorLogo: "/operators/claro.png",
    type: "saldo",
    amount: 5000,
    bonus: 1000,
    validity: "7 días",
    features: ["Llamadas", "SMS", "Datos básicos"]
  },
  {
    id: "r2",
    operator: "Claro",
    operatorColor: "red", 
    operatorLogo: "/operators/claro.png",
    type: "datos",
    amount: 15000,
    data: "3GB",
    validity: "15 días",
    features: ["Solo datos", "4G/5G", "Redes sociales gratis"]
  },
  {
    id: "r3",
    operator: "Movistar",
    operatorColor: "blue",
    operatorLogo: "/operators/movistar.png", 
    type: "saldo",
    amount: 10000,
    bonus: 2000,
    validity: "15 días",
    features: ["Llamadas", "SMS", "WhatsApp gratis"]
  },
  {
    id: "r4",
    operator: "Movistar",
    operatorColor: "blue",
    operatorLogo: "/operators/movistar.png",
    type: "combo",
    amount: 20000,
    minutes: "200 min",
    data: "2GB",
    validity: "30 días",
    features: ["Combo completo", "Redes sociales", "Música streaming"]
  },
  {
    id: "r5",
    operator: "Tigo",
    operatorColor: "blue",
    operatorLogo: "/operators/tigo.png",
    type: "datos",
    amount: 12000,
    data: "2GB",
    validity: "10 días",
    features: ["Solo datos", "4G", "YouTube gratis"]
  },
  {
    id: "r6",
    operator: "ETB",
    operatorColor: "green",
    operatorLogo: "/operators/etb.png",
    type: "saldo",
    amount: 8000,
    bonus: 1500,
    validity: "10 días",
    features: ["Llamadas locales", "SMS", "WhatsApp"]
  }
];

const operators = [
  { name: "Todos", color: "gray" },
  { name: "Claro", color: "red" },
  { name: "Movistar", color: "blue" },
  { name: "Tigo", color: "blue" },
  { name: "ETB", color: "green" }
];

// Componente principal
export default function MobileServicesPage() {
  const [activeTab, setActiveTab] = useState("planes");
  const [selectedOperator, setSelectedOperator] = useState("Todos");
  const [selectedType, setSelectedType] = useState("todos");
  const [sortBy, setSortBy] = useState("popular");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filteredPlans, setFilteredPlans] = useState(mobilePlans);
  const [filteredRecharges, setFilteredRecharges] = useState(recharges);

  // Filtros para planes
  useEffect(() => {
    let result = [...mobilePlans];

    if (selectedOperator !== "Todos") {
      result = result.filter(plan => plan.operator === selectedOperator);
    }

    if (selectedType !== "todos") {
      result = result.filter(plan => plan.type === selectedType);
    }

    if (searchTerm) {
      result = result.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
      default:
        result.sort((a, b) => Number(b.isPopular) - Number(a.isPopular));
        break;
    }

    setFilteredPlans(result);
  }, [selectedOperator, selectedType, sortBy, searchTerm]);

  // Filtros para recargas
  useEffect(() => {
    let result = [...recharges];

    if (selectedOperator !== "Todos") {
      result = result.filter(recharge => recharge.operator === selectedOperator);
    }

    if (selectedType !== "todos" && activeTab === "recargas") {
      result = result.filter(recharge => recharge.type === selectedType);
    }

    if (searchTerm && activeTab === "recargas") {
      result = result.filter(recharge =>
        recharge.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recharge.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar recargas por precio
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.amount - b.amount);
        break;
      case "price-high":
        result.sort((a, b) => b.amount - a.amount);
        break;
      default:
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    setFilteredRecharges(result);
  }, [selectedOperator, selectedType, sortBy, searchTerm, activeTab]);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Servicios Móviles
          </h1>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            Planes móviles y recargas de todos los operadores
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1">
              <button
                onClick={() => setActiveTab("planes")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "planes"
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-white hover:text-blue-200"
                }`}
              >
                <Smartphone className="w-5 h-5 inline-block mr-2" />
                Planes Móviles
              </button>
              <button
                onClick={() => setActiveTab("recargas")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === "recargas"
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-white hover:text-blue-200"
                }`}
              >
                <Zap className="w-5 h-5 inline-block mr-2" />
                Recargas
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === "planes" ? "Buscar planes..." : "Buscar recargas..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pl-12 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Filtros */}
        <section className="py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filtro por operador */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Operador:</span>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {operators.map(op => (
                    <option key={op.name} value={op.name}>{op.name}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por tipo */}
              {activeTab === "planes" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Tipo:</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="postpago">Postpago</option>
                    <option value="prepago">Prepago</option>
                  </select>
                </div>
              )}

              {activeTab === "recargas" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Tipo:</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="saldo">Saldo</option>
                    <option value="datos">Datos</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
              )}

              {/* Ordenar */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {activeTab === "planes" ? (
                    <>
                      <option value="popular">Más populares</option>
                      <option value="price-low">Menor precio</option>
                      <option value="price-high">Mayor precio</option>
                      <option value="rating">Mejor valorados</option>
                    </>
                  ) : (
                    <>
                      <option value="price-low">Menor precio</option>
                      <option value="price-high">Mayor precio</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <section className="pb-20">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activeTab === "planes" ? "Planes Móviles" : "Recargas"}
            </h2>
            <p className="text-gray-600 mt-1">
              {activeTab === "planes" 
                ? `${filteredPlans.length} planes disponibles`
                : `${filteredRecharges.length} opciones de recarga`
              }
              {selectedOperator !== "Todos" && ` de ${selectedOperator}`}
            </p>
          </div>

          {/* Grid de contenido */}
          {activeTab === "planes" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecharges.map((recharge) => (
                <RechargeCard key={recharge.id} recharge={recharge} />
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {((activeTab === "planes" && filteredPlans.length === 0) ||
            (activeTab === "recargas" && filteredRecharges.length === 0)) && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Signal className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar tus filtros o buscar algo diferente
              </p>
              <button
                onClick={() => {
                  setSelectedOperator("Todos");
                  setSelectedType("todos");
                  setSearchTerm("");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* Sección informativa */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center mb-4">
                <Smartphone className="w-8 h-8 mr-3" />
                <h3 className="text-xl font-bold">Planes Postpago</h3>
              </div>
              <p className="text-blue-100 mb-4">
                Mayor comodidad con facturación mensual y servicios ilimitados
              </p>
              <ul className="space-y-2 text-sm text-blue-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Sin límite de crédito
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Servicios premium incluidos
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Roaming internacional
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center mb-4">
                <CreditCard className="w-8 h-8 mr-3" />
                <h3 className="text-xl font-bold">Planes Prepago</h3>
              </div>
              <p className="text-green-100 mb-4">
                Control total de tu gasto sin compromisos a largo plazo
              </p>
              <ul className="space-y-2 text-sm text-green-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Sin sorpresas en facturación
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Flexibilidad total
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Recargas cuando quieras
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center mb-4">
                <Zap className="w-8 h-8 mr-3" />
                <h3 className="text-xl font-bold">Recargas Rápidas</h3>
              </div>
              <p className="text-purple-100 mb-4">
                Mantén tu línea activa con recargas instantáneas las 24 horas
              </p>
              <ul className="space-y-2 text-sm text-purple-100">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Procesamiento instantáneo
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Todos los operadores
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Bonos adicionales
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sección de operadores */}
        <section className="mb-20 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Operadores Disponibles
            </h2>
            <p className="text-gray-600">
              Trabajamos con los principales operadores del país
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {operators.slice(1).map((operator) => {
              const getOperatorGradient = (color: string) => {
                const gradients: Record<string, string> = {
                  red: 'from-red-500 to-red-600',
                  blue: 'from-blue-500 to-blue-600',
                  green: 'from-green-500 to-green-600'
                };
                return gradients[color] || 'from-gray-500 to-gray-600';
              };

              return (
                <div
                  key={operator.name}
                  className={`bg-gradient-to-br ${getOperatorGradient(operator.color)} rounded-xl p-6 text-white text-center hover:scale-105 transition-transform duration-200 cursor-pointer`}
                  onClick={() => setSelectedOperator(operator.name)}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Signal className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg">{operator.name}</h3>
                  <p className="text-sm opacity-90 mt-2">
                    {activeTab === "planes" 
                      ? `${mobilePlans.filter(p => p.operator === operator.name).length} planes`
                      : `${recharges.filter(r => r.operator === operator.name).length} opciones`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                ¿Cómo funciona la activación de planes?
              </h3>
              <p className="text-gray-600">
                Una vez que contratas un plan, recibirás las instrucciones de activación por SMS o email. 
                La activación es automática y toma entre 5 a 15 minutos.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                ¿Puedo cambiar de plan después?
              </h3>
              <p className="text-gray-600">
                Sí, puedes cambiar tu plan en cualquier momento. Los planes postpago permiten cambios 
                mensuales, mientras que los prepago puedes cambiar cuando se agote tu saldo actual.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                ¿Las recargas son instantáneas?
              </h3>
              <p className="text-gray-600">
                Sí, todas las recargas se procesan de forma instantánea las 24 horas del día. 
                Recibirás confirmación inmediata por SMS una vez completada la transacción.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Aceptamos tarjetas de crédito, débito, PSE, Nequi, Daviplata y pagos en efectivo 
                en puntos autorizados. Tu información está siempre protegida.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mb-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Necesitas ayuda personalizada?
          </h3>
          <p className="text-lg mb-8 text-blue-100">
            Nuestro equipo de expertos está listo para ayudarte a encontrar el plan perfecto
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <Phone className="w-5 h-5 inline-block mr-2" />
              Llamar Ahora
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
              <MessageSquare className="w-5 h-5 inline-block mr-2" />
              Chat en Vivo
            </button>
          </div>
        </section>
      </div>

      <div className="mb-18 lg:mb-0">
        <Footer />
      </div>
    </>
  );
}