'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Download,
  Filter,
  Search,
  ChevronDown,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  Lock,
  Bell,
  Settings,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Star,
  DollarSign,
  Zap
} from 'lucide-react';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';

// Datos de ejemplo para transacciones
const transactions = [
  {
    id: 'TXN-2024-001234',
    type: 'ticket_purchase',
    description: 'Compra de ticket - iPhone 14 Pro Max',
    amount: -1000,
    currency: 'credits',
    status: 'completed',
    date: '2024-08-25T14:30:00Z',
    method: 'credit_card',
    reference: 'RIFA-001',
    category: 'purchase',
    fees: 0,
    merchantInfo: {
      name: 'RaffleHub Store',
      id: 'RH-STORE-001'
    },
    securityLevel: 'high',
    receiptUrl: '#'
  },
  {
    id: 'TXN-2024-001235',
    type: 'credit_purchase',
    description: 'Compra de créditos',
    amount: -50000,
    currency: 'COP',
    status: 'completed',
    date: '2024-08-24T09:15:00Z',
    method: 'pse',
    reference: 'PSE-789456123',
    category: 'topup',
    fees: 2500,
    creditsReceived: 5000,
    merchantInfo: {
      name: 'Banco Ejemplo',
      id: 'PSE-001'
    },
    securityLevel: 'high',
    receiptUrl: '#'
  },
  {
    id: 'TXN-2024-001236',
    type: 'prize_received',
    description: 'Premio ganado - Smart TV LG 65"',
    amount: 0,
    currency: 'prize',
    status: 'completed',
    date: '2024-08-20T16:45:00Z',
    method: 'raffle_win',
    reference: 'WIN-2024-0045',
    category: 'prize',
    fees: 0,
    prizeValue: 3200000,
    merchantInfo: {
      name: 'RaffleHub Premios',
      id: 'RH-PRIZES-001'
    },
    securityLevel: 'verified',
    receiptUrl: '#'
  },
  {
    id: 'TXN-2024-001237',
    type: 'refund',
    description: 'Reembolso - Rifa cancelada MacBook Air',
    amount: 1200,
    currency: 'credits',
    status: 'completed',
    date: '2024-08-18T11:20:00Z',
    method: 'automatic',
    reference: 'REF-2024-0012',
    category: 'refund',
    fees: 0,
    merchantInfo: {
      name: 'RaffleHub Reembolsos',
      id: 'RH-REFUNDS-001'
    },
    securityLevel: 'high',
    receiptUrl: '#'
  },
  {
    id: 'TXN-2024-001238',
    type: 'ticket_purchase',
    description: 'Compra de ticket - PlayStation 5',
    amount: -900,
    currency: 'credits',
    status: 'pending',
    date: '2024-08-25T18:20:00Z',
    method: 'credit_card',
    reference: 'RIFA-004',
    category: 'purchase',
    fees: 0,
    merchantInfo: {
      name: 'RaffleHub Store',
      id: 'RH-STORE-001'
    },
    securityLevel: 'processing',
    receiptUrl: '#'
  },
  {
    id: 'TXN-2024-001239',
    type: 'credit_purchase',
    description: 'Compra de créditos',
    amount: -25000,
    currency: 'COP',
    status: 'failed',
    date: '2024-08-23T13:45:00Z',
    method: 'nequi',
    reference: 'NEQ-456789012',
    category: 'topup',
    fees: 0,
    errorCode: 'INSUFFICIENT_FUNDS',
    merchantInfo: {
      name: 'Nequi',
      id: 'NEQ-001'
    },
    securityLevel: 'secure',
    receiptUrl: '#'
  }
];

// Estadísticas del usuario
const userStats = {
  totalSpent: 125000,
  totalCreditsUsed: 8100,
  totalPrizesWon: 1,
  totalTransactions: 42,
  averageTransactionAmount: 2976,
  lastTransactionDate: '2024-08-25',
  accountBalance: 2400,
  securityScore: 98
};

const TransactionHistoryPage = () => {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filtrar transacciones
  useEffect(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      // Filtro de fecha (simplificado para el ejemplo)
      let matchesDate = true;
      if (selectedDateRange !== 'all') {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        const daysDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (selectedDateRange) {
          case '7days':
            matchesDate = daysDiff <= 7;
            break;
          case '30days':
            matchesDate = daysDiff <= 30;
            break;
          case '90days':
            matchesDate = daysDiff <= 90;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
    
    setFilteredTransactions(filtered);
  }, [searchTerm, selectedStatus, selectedCategory, selectedDateRange]);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(Math.abs(amount));
    } else if (currency === 'credits') {
      return `${Math.abs(amount).toLocaleString()} créditos`;
    } else if (currency === 'prize') {
      return 'Premio';
    }
    return amount;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallida';
      case 'processing':
        return 'Procesando';
      default:
        return 'Desconocido';
    }
  };

  const getTransactionIcon = (_type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    } else {
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const exportTransactions = () => {
    // En un caso real, esto generaría un CSV o PDF
    alert('Función de exportación próximamente');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <Navbar/>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Historial de Transacciones
              </h1>
              <p className="text-blue-100 text-lg">
                Gestiona y revisa todas tus transacciones de forma segura
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{userStats.securityScore}%</div>
                <div className="text-sm text-blue-100">Seguridad</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Actual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userStats.accountBalance.toLocaleString()} créditos
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(userStats.totalSpent, 'COP')}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Premios Ganados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userStats.totalPrizesWon}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userStats.totalTransactions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de seguridad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 mb-1">
                Cuenta Verificada y Segura
              </h3>
              <p className="text-sm text-green-700">
                Tu cuenta está protegida con autenticación de dos factores y encriptación de extremo a extremo. 
                Última verificación: hace 2 horas.
              </p>
            </div>
            <button className="text-green-600 hover:text-green-800 ml-4">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={exportTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="completed">Completadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="failed">Fallidas</option>
                  <option value="processing">Procesando</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="purchase">Compras</option>
                  <option value="topup">Recarga de créditos</option>
                  <option value="prize">Premios</option>
                  <option value="refund">Reembolsos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todo el tiempo</option>
                  <option value="7days">Últimos 7 días</option>
                  <option value="30days">Últimos 30 días</option>
                  <option value="90days">Últimos 90 días</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Transacciones ({filteredTransactions.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                      {getTransactionIcon(transaction.type, transaction.amount)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {transaction.description}
                        </h3>
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm text-gray-500">
                          {getStatusText(transaction.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>ID: {transaction.id}</span>
                        <button
                          onClick={() => copyToClipboard(transaction.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedId === transaction.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(transaction.date).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {transaction.method.replace('_', ' ').toUpperCase()}
                        </div>
                        {transaction.reference && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Ref: {transaction.reference}
                          </div>
                        )}
                      </div>

                      {/* Información adicional según el tipo */}
                      {transaction.creditsReceived && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <span className="text-sm text-green-700">
                            +{transaction.creditsReceived.toLocaleString()} créditos recibidos
                          </span>
                        </div>
                      )}

                      {transaction.prizeValue && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                          <span className="text-sm text-yellow-700">
                            Premio valorado en {formatCurrency(transaction.prizeValue, 'COP')}
                          </span>
                        </div>
                      )}

                      {transaction.errorCode && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <span className="text-sm text-red-700">
                            Error: {transaction.errorCode.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>

                    {transaction.fees > 0 && (
                      <div className="text-sm text-gray-500">
                        Comisión: {formatCurrency(transaction.fees, 'COP')}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-end gap-2">
                      {transaction.securityLevel && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.securityLevel === 'high' || transaction.securityLevel === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : transaction.securityLevel === 'secure'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {transaction.securityLevel === 'verified' ? 'Verificado' :
                             transaction.securityLevel === 'high' ? 'Alta' :
                             transaction.securityLevel === 'secure' ? 'Segura' : 'Procesando'}
                          </div>
                        </div>
                      )}

                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>

                      {transaction.receiptUrl && (
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No se encontraron transacciones
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar tus filtros o realizar tu primera transacción
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Ver Rifas Disponibles
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuraciones de seguridad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Configuraciones de Seguridad
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Autenticación 2FA
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Protección adicional activada
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Alertas SMS
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Notificaciones instantáneas
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Activo
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Detección de Fraude
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    IA avanzada monitoreando
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Activo
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Configuraciones Avanzadas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Gestiona límites de transacciones y preferencias de seguridad
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centro de ayuda y soporte */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Necesitas ayuda con una transacción?
                </h3>
                <p className="text-gray-600 mb-4">
                  Nuestro equipo de soporte está disponible 24/7 para resolver cualquier duda sobre tus transacciones.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Chat en Vivo
                  </button>
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                    Reportar Problema
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1">
                    <ExternalLink className="w-4 h-4" />
                    FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Política de transacciones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Información Importante sobre Transacciones
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Transacciones Seguras</h4>
                    <p className="text-sm text-gray-600">
                      Todas las transacciones están protegidas con encriptación SSL de 256 bits y son monitoreadas 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Tiempos de Procesamiento</h4>
                    <p className="text-sm text-gray-600">
                      Las transacciones con tarjeta son instantáneas. PSE y transferencias pueden tomar hasta 2 horas hábiles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Política de Reembolsos</h4>
                    <p className="text-sm text-gray-600">
                      Los reembolsos se procesan automáticamente en caso de rifas canceladas, en un plazo máximo de 5 días hábiles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <DollarSign className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Comisiones Transparentes</h4>
                    <p className="text-sm text-gray-600">
                      No cobramos comisiones ocultas. Todas las tarifas se muestran claramente antes de completar la transacción.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Protección Antifraude</h4>
                    <p className="text-sm text-gray-600">
                      Utilizamos IA avanzada para detectar actividades sospechosas y proteger tu cuenta automáticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Comprobantes Digitales</h4>
                    <p className="text-sm text-gray-600">
                      Cada transacción genera un comprobante digital descargable con validez legal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <strong>Compromiso de Seguridad:</strong> RaffleHub cumple con los más altos estándares de seguridad financiera 
                    y está registrado ante la Superintendencia de Industria y Comercio. Tus datos están protegidos bajo la Ley 1581 de 2012.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de actividad mensual */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Actividad de Este Mes
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
                <div className="text-sm text-gray-600">Transacciones</div>
                <div className="text-xs text-green-600 mt-1">+20% vs mes anterior</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">$45,300</div>
                <div className="text-sm text-gray-600">Total gastado</div>
                <div className="text-xs text-blue-600 mt-1">Promedio: $3,775</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">3,200</div>
                <div className="text-sm text-gray-600">Créditos ganados</div>
                <div className="text-xs text-purple-600 mt-1">Por bonificaciones</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-18 lg:mb-0">
        <Footer />
    </div>
    </div>
  );
};

export default TransactionHistoryPage;