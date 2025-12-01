'use client';
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  ShoppingBag,
  BarChart3,
  Wallet,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

// Tipos de datos
interface Product {
  id: number;
  name: string;
  price: number;
  mainImageUrl: string;
  stock: number;
  categoryName: string;
  rating: number;
  reviewCount: number;
}

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

export default function SellerDashboard() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'products' | 'create' | 'analytics' | 'withdrawals'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simular carga de datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Aquí harías: productService.getMyProducts()
    setStats({
      totalProducts: 24,
      totalSales: 156,
      totalRevenue: 12450000,
      averageRating: 4.7
    });

    setProducts([
      {
        id: 1,
        name: 'Camiseta Deportiva Premium',
        price: 45000,
        mainImageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        stock: 50,
        categoryName: 'Deporte',
        rating: 4.8,
        reviewCount: 24
      },
      {
        id: 2,
        name: 'Audífonos Bluetooth Pro',
        price: 120000,
        mainImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        stock: 15,
        categoryName: 'Tecnología',
        rating: 4.5,
        reviewCount: 18
      },
      {
        id: 3,
        name: 'Reloj Inteligente X200',
        price: 280000,
        mainImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        stock: 8,
        categoryName: 'Tecnología',
        rating: 4.9,
        reviewCount: 32
      }
    ]);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderizar sección activa
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProducts();
      case 'create':
        return renderCreateProduct();
      case 'analytics':
        return renderAnalytics();
      case 'withdrawals':
        return renderWithdrawals();
      default:
        return renderDashboard();
    }
  };

  // Dashboard Overview
  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Vista general de tu negocio</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Productos</p>
              <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ventas Totales</p>
              <p className="text-3xl font-bold mt-2">{stats.totalSales}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Ingresos</p>
              <p className="text-3xl font-bold mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Rating Promedio</p>
              <p className="text-3xl font-bold mt-2">{stats.averageRating} ⭐</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Productos recientes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Productos Recientes</h3>
          <button
            onClick={() => setActiveSection('products')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Ver todos →
          </button>
        </div>
        <div className="space-y-4">
          {products.slice(0, 3).map(product => (
            <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-600">{product.categoryName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${product.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Mis Productos
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mis Productos</h2>
          <p className="text-gray-600 mt-1">Gestiona tu inventario</p>
        </div>
        <button
          onClick={() => setActiveSection('create')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5" />
              Filtros
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {product.categoryName}
                </span>
                <h3 className="font-bold text-gray-900 mt-2">{product.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm text-gray-600">{product.rating} ({product.reviewCount})</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-gray-900">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredProducts.map(product => (
            <div key={product.id} className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.categoryName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-500 text-sm">★ {product.rating}</span>
                  <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">${product.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Crear Producto (placeholder)
  const renderCreateProduct = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Publicar Producto</h2>
        <p className="text-gray-600 mt-1">Completa el formulario para agregar un nuevo producto</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aquí irá el formulario de creación de producto que ya creamos anteriormente</p>
        <button
          onClick={() => setActiveSection('products')}
          className="mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Volver a Mis Productos
        </button>
      </div>
    </div>
  );

  // Analytics (placeholder)
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Análisis de Ventas</h2>
        <p className="text-gray-600 mt-1">Métricas y estadísticas de tu negocio</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Próximamente: Gráficos de ventas, productos más vendidos, tendencias y más</p>
      </div>
    </div>
  );

  // Withdrawals (placeholder)
  const renderWithdrawals = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Retiros</h2>
        <p className="text-gray-600 mt-1">Gestiona tus pagos y retiros</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Wallet className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Saldo disponible</p>
          <p className="text-5xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <button className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all">
          Solicitar Retiro
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">VeryGana</h1>
              <p className="text-xs text-gray-600">Panel Seller</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'dashboard'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSection('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'products'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Mis Productos</span>
          </button>

          <button
            onClick={() => setActiveSection('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'create'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Publicar Producto</span>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'analytics'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Análisis de Ventas</span>
          </button>

          <button
            onClick={() => setActiveSection('withdrawals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'withdrawals'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Retiros</span>
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="ml-64 flex-1 p-8">
        {renderActiveSection()}
      </div>
    </div>
  );
}