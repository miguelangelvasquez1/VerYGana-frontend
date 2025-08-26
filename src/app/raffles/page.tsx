'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Gift, 
  CreditCard, 
  Ticket, 
  Trophy, 
  Users, 
  Clock, 
  Star,
  Filter,
  Search,
  ChevronDown,
  Heart,
  Share2,
  TrendingUp,
  Award,
  Timer,
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react';
import NavBar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';

const WinnersCarousel = () => (
  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center">
        <Trophy className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium animate-pulse">
          ¡Felicitaciones a María por ganar el iPhone 14 Pro Max! - Próximo sorteo en 2 días
        </span>
      </div>
    </div>
  </div>
);

type Phone = {
  id: number;
  name: string;
  image: string;
  date: string;
};

interface CarouselProps {
  phones: Phone[];
}

const Carousel: React.FC<CarouselProps> = ({ phones }) => (
  <div className="overflow-hidden">
    <div className="flex space-x-4 animate-pulse">
      {phones.map((phone) => (
        <div key={phone.id} className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm border min-w-[200px]">
          <div className="w-full h-24 bg-gray-200 rounded-lg mb-2"></div>
          <h3 className="font-semibold text-sm">{phone.name}</h3>
          <p className="text-xs text-gray-600">{phone.date}</p>
        </div>
      ))}
    </div>
  </div>
);

const raffles = [
  {
    id: 1,
    title: 'iPhone 14 Pro Max',
    image: '/phones/iphone.webp',
    drawDate: '10 de agosto de 2025',
    ticketPrice: 1000,
    ticketsLeft: 50,
    totalTickets: 100,
    reward: 'iPhone 14 Pro Max 128GB',
    isActive: true,
    category: 'phones',
    featured: true,
    participants: 50,
    timeLeft: '2 días 14 horas',
    originalPrice: 4500000,
    savings: 4499000,
    description: 'El iPhone más avanzado con chip A16 Bionic y sistema de cámaras profesional.'
  },
  {
    id: 2,
    title: 'Smart TV LG 65"',
    image: '/products/tv.jpg',
    drawDate: '12 de agosto de 2025',
    ticketPrice: 800,
    ticketsLeft: 20,
    totalTickets: 80,
    reward: 'Smart TV LG 65" OLED',
    isActive: true,
    category: 'electronics',
    featured: false,
    participants: 60,
    timeLeft: '4 días 8 horas',
    originalPrice: 3200000,
    savings: 3199200,
    description: 'Televisor OLED con tecnología AI ThinQ y resolución 4K Ultra HD.'
  },
  {
    id: 3,
    title: 'MacBook Air M2',
    image: '/products/macbook.jpg',
    drawDate: '15 de agosto de 2025',
    ticketPrice: 1200,
    ticketsLeft: 35,
    totalTickets: 75,
    reward: 'MacBook Air M2 13"',
    isActive: true,
    category: 'computers',
    featured: false,
    participants: 40,
    timeLeft: '7 días 20 horas',
    originalPrice: 5200000,
    savings: 5198800,
    description: 'Laptop ultradelgada con chip M2, pantalla Liquid Retina y hasta 18 horas de batería.'
  },
  {
    id: 4,
    title: 'PlayStation 5',
    image: '/products/ps5.jpg',
    drawDate: '18 de agosto de 2025',
    ticketPrice: 900,
    ticketsLeft: 15,
    totalTickets: 60,
    reward: 'PlayStation 5 Digital',
    isActive: true,
    category: 'gaming',
    featured: true,
    participants: 45,
    timeLeft: '10 días 5 horas',
    originalPrice: 2800000,
    savings: 2799100,
    description: 'Consola de última generación con gráficos 4K y carga ultrarrápida.'
  }
];

const phones = [
  {
    id: 1,
    name: 'iPhone 14 Pro Max',
    image: '/phones/iphone.webp',
    date: '22 de julio de 2025',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    image: '/phones/samsung.png',
    date: '23 de julio de 2025',
  },
  {
    id: 3,
    name: 'Xiaomi Redmi Note 13',
    image: '/phones/xiaomi.png',
    date: '24 de julio de 2025',
  },
];

const categories = [
  { id: 'all', name: 'Todas', icon: Gift },
  { id: 'phones', name: 'Teléfonos', icon: CreditCard },
  { id: 'electronics', name: 'Electrónicos', icon: Zap },
  { id: 'computers', name: 'Computadores', icon: Award },
  { id: 'gaming', name: 'Gaming', icon: Trophy }
];

// Componente de tarjeta de rifa mejorada
type Raffle = {
  id: number;
  title: string;
  image: string;
  drawDate: string;
  ticketPrice: number;
  ticketsLeft: number;
  totalTickets: number;
  reward: string;
  isActive: boolean;
  category: string;
  featured: boolean;
  participants: number;
  timeLeft: string;
  originalPrice: number;
  savings: number;
  description: string;
};

interface RaffleCardProps {
  raffle: Raffle;
  onFavorite: (id: number) => void;
  isFavorite: boolean;
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle, onFavorite, isFavorite }) => {
  const progressPercentage = ((raffle.totalTickets - raffle.ticketsLeft) / raffle.totalTickets) * 100;
  
  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === 'string' ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Badge de destacado */}
      {raffle.featured && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Destacado
          </span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => onFavorite(raffle.id)}
          className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button className="p-2 bg-white/80 text-gray-600 rounded-full backdrop-blur-sm hover:bg-blue-500 hover:text-white transition-all duration-200">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Imagen */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
          {raffle.category}
        </div>
      </div>

      <div className="p-6">
        {/* Título y descripción */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {raffle.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {raffle.description}
          </p>
        </div>

        {/* Información del premio */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Premio:</span>
            <span className="text-lg font-bold text-blue-600">{formatPrice(raffle.originalPrice)}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{raffle.reward}</p>
          <div className="mt-2 text-xs text-green-600 font-medium">
            Ahorro potencial: {formatPrice(raffle.savings)}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-xs text-gray-600">Precio Ticket</span>
            </div>
            <span className="font-bold text-gray-900">{raffle.ticketPrice} créditos</span>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-xs text-gray-600">Participantes</span>
            </div>
            <span className="font-bold text-gray-900">{raffle.participants}</span>
          </div>
        </div>

        {/* Progreso de tickets */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm text-gray-600">
              {raffle.totalTickets - raffle.ticketsLeft} / {raffle.totalTickets}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {raffle.ticketsLeft} tickets restantes
          </p>
        </div>

        {/* Tiempo restante */}
        <div className="flex items-center justify-between mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center">
            <Timer className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">Tiempo restante:</span>
          </div>
          <span className="font-bold text-red-600">{raffle.timeLeft}</span>
        </div>

        {/* Fecha de sorteo */}
        <div className="flex items-center mb-6 text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Sorteo: {raffle.drawDate}</span>
        </div>

        {/* Botón de compra */}
        <button className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center group">
          <Ticket className="w-5 h-5 mr-2 group-hover:animate-pulse" />
          Comprar Ticket
        </button>

        {/* Garantía */}
        <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
          <Shield className="w-3 h-3 mr-1" />
          Sorteo certificado y transparente
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function RafflesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredRaffles = raffles.filter(raffle => {
    const matchesCategory = selectedCategory === 'all' || raffle.category === selectedCategory;
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.reward.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return Number(b.featured) - Number(a.featured);
      case 'price-low':
        return a.ticketPrice - b.ticketPrice;
      case 'price-high':
        return b.ticketPrice - a.ticketPrice;
      case 'ending-soon':
        return a.ticketsLeft - b.ticketsLeft;
      default:
        return 0;
    }
  });

  const handleFavorite = (raffleId: unknown) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(raffleId)) {
      newFavorites.delete(raffleId);
    } else {
      newFavorites.add(raffleId);
    }
    setFavorites(newFavorites);
  };

  return (
    <>
      <NavBar />
      <WinnersCarousel />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Gana Premios Increíbles
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Participa en nuestras rifas certificadas y transparentes. Miles de ganadores ya han cambiado sus vidas.
          </p>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Tickets vendidos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold mb-2">1,200+</div>
              <div className="text-blue-100">Ganadores felices</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold mb-2">$2.5B+</div>
              <div className="text-blue-100">En premios entregados</div>
            </div>
          </div>
        </div>
      </div>

      <main className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        {/* Sección de teléfonos destacados */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Teléfonos en Juego Hoy
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Los dispositivos más codiciados están esperando por ti. No te pierdas la oportunidad.
              </p>
            </div>
            <Carousel phones={phones} />
          </div>
        </section>

        {/* Filtros y búsqueda */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-y">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar rifas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Filtros y ordenamiento */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-auto`}>
                  <div className="flex flex-wrap gap-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="featured">Destacadas</option>
                      <option value="price-low">Precio: Menor</option>
                      <option value="price-high">Precio: Mayor</option>
                      <option value="ending-soon">Terminan Pronto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorías */}
            <div className={`mt-6 ${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Lista de rifas */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Rifas Activas
              </h2>
              <div className="text-sm text-gray-600">
                {filteredRaffles.length} rifa{filteredRaffles.length !== 1 ? 's' : ''} disponible{filteredRaffles.length !== 1 ? 's' : ''}
              </div>
            </div>

            {filteredRaffles.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRaffles.map((raffle) => (
                  <RaffleCard
                    key={raffle.id}
                    raffle={raffle}
                    onFavorite={handleFavorite}
                    isFavorite={favorites.has(raffle.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No se encontraron rifas
                </h3>
                <p className="text-gray-500 mb-6">
                  Intenta ajustar tus filtros o buscar algo diferente
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Todas las Rifas
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Sección de garantías */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ¿Por Qué Elegir RaffleHub?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Somos la plataforma de rifas más confiable del país, con miles de ganadores satisfechos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  100% Transparente
                </h3>
                <p className="text-gray-600">
                  Todos nuestros sorteos son certificados y transmitidos en vivo para garantizar total transparencia.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Pagos Seguros
                </h3>
                <p className="text-gray-600">
                  Utilizamos la mejor tecnología de seguridad para proteger tus datos y transacciones.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Mejores Odds
                </h3>
                <p className="text-gray-600">
                  Ofrecemos las mejores probabilidades de ganar con tickets limitados por rifa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo Para Cambiar Tu Vida?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Únete a miles de personas que ya han ganado premios increíbles. Tu próxima gran victoria te espera.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-200">
              Ver Todas las Rifas
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
              Crear Cuenta Gratis
            </button>
          </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Lo Que Dicen Nuestros Ganadores
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">María González</h4>
                    <p className="text-sm text-gray-600">Ganó iPhone 14 Pro</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "No podía creer cuando me llamaron para decirme que había ganado. El proceso fue súper transparente y recibí mi premio en perfecto estado."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    C
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Carlos Ramírez</h4>
                    <p className="text-sm text-gray-600">Ganó PlayStation 5</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Llevaba meses tratando de conseguir una PS5 y aquí la gané con solo un ticket. La plataforma es confiable y el sorteo fue en vivo."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    L
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Laura Martínez</h4>
                    <p className="text-sm text-gray-600">Ganó MacBook Air</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Perfecto para mis estudios universitarios. La experiencia fue increíble desde la compra del ticket hasta recibir mi premio."
                </p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Preguntas Frecuentes
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ¿Cómo funcionan las rifas?
                </h3>
                <p className="text-gray-600">
                  Compras tickets para participar en las rifas que te interesen. Una vez que se vendan todos los tickets o se alcance la fecha límite, realizamos el sorteo en vivo y de manera transparente. El ganador es seleccionado aleatoriamente.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ¿Cómo sé que los sorteos son justos?
                </h3>
                <p className="text-gray-600">
                  Todos nuestros sorteos son certificados por auditores independientes y transmitidos en vivo a través de nuestras redes sociales. Además, utilizamos sistemas de números aleatorios verificables.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ¿Qué pasa si gano?
                </h3>
                <p className="text-gray-600">
                  Te contactaremos inmediatamente después del sorteo para coordinar la entrega de tu premio. Tienes 30 días para reclamar tu premio y nosotros nos encargamos del envío sin costo adicional.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ¿Puedo comprar múltiples tickets?
                </h3>
                <p className="text-gray-600">
                  Sí, puedes comprar tantos tickets como desees para aumentar tus probabilidades de ganar. No hay límite en la cantidad de tickets que puedes adquirir por rifa.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ¿Qué métodos de pago aceptan?
                </h3>
                <p className="text-gray-600">
                  Aceptamos tarjetas de crédito, débito, PSE, Nequi, Daviplata y otros métodos de pago digitales. Todos los pagos son procesados de forma segura.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="mb-18 lg:mb-0">
        <Footer />
      </div>
    </>
  );
}