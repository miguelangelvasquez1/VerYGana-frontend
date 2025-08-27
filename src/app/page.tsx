'use client'

import { useState, useEffect } from "react";
import { 
  Play,
  Gift,
  ShoppingCart,
  Smartphone,
  Star,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Heart,
  Award,
  ChevronRight,
  Eye,
  Coins,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import NavBarNoAuth from "@/components/bars/NavBarNoAuth";
import Footer from "@/components/Footer";
import Link from "next/link";
import NavBarNoAuth2 from "@/components/bars/NavBarNoAuth2";

// Datos simulados
const phones = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    image: '/phones/iphone.webp',
    date: '25 de agosto de 2025',
    value: 4500000,
    participants: 2847,
    timeLeft: '2 horas',
    probability: '1 en 3,000',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    image: '/phones/samsung.png',
    date: '26 de agosto de 2025',
    value: 3200000,
    participants: 1923,
    timeLeft: '1 día',
    probability: '1 en 2,500',
  },
  {
    id: 3,
    name: 'Xiaomi 14 Pro',
    image: '/phones/xiaomi.png',
    date: '27 de agosto de 2025',
    value: 2100000,
    participants: 1456,
    timeLeft: '2 días',
    probability: '1 en 2,000',
  },
];

const products = [
  {
    id: "1",
    name: "Camiseta Premium de Algodón Orgánico",
    imageUrl: "/products/camiseta.png",
    image: "/products/camiseta.png",
    date: '2024-06-02',
    price: 45000,
    originalPrice: 60000,
    stock: 850,
    isActive: true,
    rating: 4.8,
    reviews: 234,
    category: "Moda",
    discount: 25,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "2",
    name: "Casco Integral Profesional DOT/ECE",
    imageUrl: "/products/casco.png",
    image: "/products/casco.png",
    date: '2024-06-02',
    price: 289000,
    originalPrice: 350000,
    stock: 23,
    isActive: true,
    rating: 4.9,
    reviews: 156,
    category: "Deportes",
    discount: 17,
    isNew: false,
    isFeatured: true,
  },
  {
    id: "3",
    name: "Set Anillos Plata 925 Pareja",
    imageUrl: "/products/anillos.png",
    image: "/products/anillos.png",
    date: '2024-06-02',
    price: 28900,
    originalPrice: 35000,
    stock: 67,
    isActive: true,
    rating: 4.6,
    reviews: 189,
    category: "Joyería",
    discount: 17,
    isNew: false,
    isFeatured: false,
  },
];

const features = [
  {
    icon: Gift,
    title: "Rifas Diarias",
    description: "Participa en rifas de celulares, laptops y más premios increíbles todos los días",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Coins,
    title: "Gana Créditos",
    description: "Ve anuncios, invita amigos y gana créditos para participar en rifas gratis",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: ShoppingCart,
    title: "Tienda Premium",
    description: "Compra productos de calidad con descuentos exclusivos para usuarios",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Sistema de Referidos",
    description: "Invita amigos y gana créditos por cada compra que realicen",
    color: "from-green-500 to-emerald-500"
  }
];

const testimonials = [
  {
    name: "María González",
    avatar: "/avatars/maria.jpg",
    text: "¡Increíble! Gané un iPhone 15 en mi tercera rifa. La plataforma es súper confiable.",
    rating: 5,
    prize: "iPhone 15 Pro"
  },
  {
    name: "Carlos Rodríguez",
    avatar: "/avatars/carlos.jpg",
    text: "Los créditos gratis me permitieron participar sin gastar mi dinero. ¡Excelente sistema!",
    rating: 5,
    prize: "Samsung Galaxy S24"
  },
  {
    name: "Ana Silva",
    avatar: "/avatars/ana.jpg",
    text: "La tienda tiene productos geniales y los precios son súper competitivos.",
    rating: 5,
    prize: "Referidos activos"
  }
];

const stats = [
  { number: "50,000+", label: "Usuarios activos", icon: Users },
  { number: "2,847", label: "Premios entregados", icon: Gift },
  { number: "98.5%", label: "Satisfacción", icon: Heart },
  { number: "24/7", label: "Soporte disponible", icon: Shield }
];

export default function Home() {
  const [showAd, setShowAd] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [adCredits, setAdCredits] = useState(0);

  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === 'string' ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateAdWatch = () => {
    setShowAd(true);
    // Simular ganar créditos después de ver anuncio
    setTimeout(() => {
      setAdCredits(prev => prev + 50);
      setShowAd(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <NavBarNoAuth2 />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Gana Premios
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Increíbles
                </span>
                Todos los Días
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Participa en rifas diarias, gana créditos viendo anuncios, compra en nuestra tienda 
                y accede a un mundo de oportunidades para ganar los mejores premios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Empezar Ahora
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200">
                  Ver Rifas Activas
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Smartphone className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-semibold">iPhone 15 Pro</p>
                    <p className="text-blue-200 text-sm">Rifa en 2 horas</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Gift className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-semibold">2,847 Premios</p>
                    <p className="text-blue-200 text-sm">Entregados</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Coins className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-semibold">Créditos Gratis</p>
                    <p className="text-blue-200 text-sm">Ve anuncios</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Users className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-semibold">50K+ Usuarios</p>
                    <p className="text-blue-200 text-sm">Comunidad activa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre todas las formas en que puedes ganar premios increíbles y disfrutar de una experiencia única
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earn Credits Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">¡Nuevo!</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Gana Créditos Gratis Viendo Anuncios
                </h2>
                <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                  Ve anuncios publicitarios cortos y gana créditos que puedes usar para participar en rifas 
                  sin gastar tu dinero. ¡Es gratis y fácil!
                </p>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">50</div>
                    <div className="text-purple-200 text-sm">Créditos por anuncio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">30s</div>
                    <div className="text-purple-200 text-sm">Duración promedio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">∞</div>
                    <div className="text-purple-200 text-sm">Anuncios por día</div>
                  </div>
                </div>

                {!showAd ? (
                  <button
                    onClick={simulateAdWatch}
                    className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center gap-3"
                  >
                    <Play className="w-6 h-6" />
                    Ver Anuncio y Ganar Créditos
                  </button>
                ) : (
                  <div className="bg-white/20 rounded-xl p-6 border border-white/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="font-medium">Reproduciendo anuncio...</span>
                    </div>
                    <div className="bg-white/20 rounded-lg h-2">
                      <div className="bg-white h-2 rounded-lg animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">Anuncios Disponibles</span>
                    </div>
                    <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
                      24 disponibles
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Anuncio de Tecnología</span>
                        <span className="text-yellow-300 font-bold">+50 créditos</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Anuncio de Moda</span>
                        <span className="text-yellow-300 font-bold">+50 créditos</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Anuncio de Comida</span>
                        <span className="text-yellow-300 font-bold">+50 créditos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Raffles Section */}
      <section id="rifas" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🎯 Rifas Activas Hoy
            </h2>
            <p className="text-xl text-gray-600">
              Participa ahora en las rifas más emocionantes del momento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {phones.map((phone, index) => (
              <div key={phone.id} className="group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border">
                  <div className="relative">
                    <img
                      src={phone.image}
                      alt={phone.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {phone.timeLeft}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {phone.participants.toLocaleString()} participando
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{phone.name}</h3>
                    <p className="text-gray-600 mb-4">Valor: {formatPrice(phone.value)}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Probabilidad:</span>
                        <span className="font-medium text-green-600">{phone.probability}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sorteo:</span>
                        <span className="font-medium">{phone.date}</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                      Participar Ahora
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2">
              Ver Todas las Rifas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona VerYGana?
            </h2>
            <p className="text-xl text-gray-600">
              Sigue estos simples pasos y empieza a ganar increíbles premios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Crea tu Cuenta",
                description: "Regístrate gratis en menos de 2 minutos",
                icon: Users,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Gana Créditos",
                description: "Ve anuncios, invita amigos o deposita dinero",
                icon: Coins,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Participa en Rifas",
                description: "Elige tu premio favorito y participa",
                icon: Target,
                color: "from-green-500 to-emerald-500"
              },
              {
                step: "04",
                title: "¡Gana Premios!",
                description: "Espera el sorteo y recibe tu premio",
                icon: Award,
                color: "from-yellow-500 to-orange-500"
              }
            ].map((step, index) => (
              <div key={index} className="relative text-center">
                <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Store Section */}
      <section id="tienda" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🛍️ Tienda Premium
            </h2>
            <p className="text-xl text-gray-600">
              Productos de calidad con descuentos exclusivos para nuestra comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{product.discount}%
                      </div>
                    )}
                    {product.isNew && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Nuevo
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.reviews})</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center gap-2">
              Ver Toda la Tienda
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lo que Dicen Nuestros Ganadores
            </h2>
            <p className="text-xl text-blue-200">
              Miles de usuarios ya han ganado premios increíbles
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-10 h-10 text-white" />
                </div>
                
                <div className="mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current inline-block" />
                  ))}
                </div>
                
                <blockquote className="text-2xl font-medium text-center mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {testimonials[currentTestimonial].name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{testimonials[currentTestimonial].name}</div>
                    <div className="text-blue-200">Ganó: {testimonials[currentTestimonial].prize}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentTestimonial ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  💰 Sistema de Referidos
                </h2>
                <p className="text-xl text-green-100 mb-8 leading-relaxed">
                  Invita a tus amigos y gana créditos por cada compra que realicen. 
                  ¡Es una forma genial de ganar dinero extra mientras compartes algo increíble!
                </p>
                
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">$15.000</div>
                    <div className="text-green-200 text-sm">Por referido</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">5%</div>
                    <div className="text-green-200 text-sm">De sus compras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">∞</div>
                    <div className="text-green-200 text-sm">Sin límites</div>
                  </div>
                </div>
                
                <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Empezar a Referir
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <div className="text-white">
                      <h4 className="font-bold">Comparte tu código único</h4>
                      <p className="text-green-100 text-sm">Cada usuario tiene un código personal</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <div className="text-white">
                      <h4 className="font-bold">Tus amigos se registran</h4>
                      <p className="text-green-100 text-sm">Usando tu código al crear su cuenta</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <div className="text-white">
                      <h4 className="font-bold">¡Ganas créditos automáticamente!</h4>
                      <p className="text-green-100 text-sm">Por cada compra que realicen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🔒 Tu Seguridad es Nuestra Prioridad
            </h2>
            <p className="text-xl text-gray-600">
              Plataforma 100% segura con tecnología de encriptación avanzada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Transacciones Seguras</h3>
              <p className="text-gray-600">
                Todas las transacciones están protegidas con encriptación SSL de 256 bits
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sorteos Transparentes</h3>
              <p className="text-gray-600">
                Todos los sorteos son auditados y verificados por terceros independientes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Soporte 24/7</h3>
              <p className="text-gray-600">
                Nuestro equipo de soporte está disponible las 24 horas para ayudarte
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            ¿Listo para Empezar a Ganar?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Únete a miles de usuarios que ya están ganando premios increíbles todos los días. 
            ¡Tu próximo premio te está esperando!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-2xl">
              🚀 Crear Cuenta Gratis
            </button>
            <button className="border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105">
              📱 Descargar App
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Registro gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Sin comisiones ocultas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Premios reales garantizados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}