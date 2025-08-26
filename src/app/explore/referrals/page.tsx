'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Gift, 
  Share2, 
  Copy, 
  CheckCircle, 
  Star, 
  Trophy, 
  Coins,
  UserPlus,
  Calendar,
  TrendingUp,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  MessageCircle,
  Link,
  ChevronRight,
  Award,
  Clock,
  DollarSign
} from 'lucide-react';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';

// Datos simulados
const mockUser = {
  id: '1',
  name: 'María González',
  email: 'maria@example.com',
  referralCode: 'MARIA2024',
  totalCredits: 125000,
  availableCredits: 85000,
  usedCredits: 40000,
  totalReferrals: 12,
  activeReferrals: 8,
  level: 'Gold',
  nextLevelReferrals: 3
};

const mockReferrals = [
  {
    id: '1',
    name: 'Ana Rodríguez',
    email: 'ana@example.com',
    status: 'active',
    joinDate: '2024-08-20',
    creditsEarned: 25000,
    purchases: 3,
    totalSpent: 150000
  },
  {
    id: '2',
    name: 'Carlos Mendez',
    email: 'carlos@example.com',
    status: 'pending',
    joinDate: '2024-08-22',
    creditsEarned: 15000,
    purchases: 1,
    totalSpent: 75000
  },
  {
    id: '3',
    name: 'Laura Silva',
    email: 'laura@example.com',
    status: 'active',
    joinDate: '2024-08-15',
    creditsEarned: 35000,
    purchases: 5,
    totalSpent: 280000
  }
];

const rewardTiers = [
  { level: 'Bronze', minReferrals: 0, creditPerReferral: 15000, bonus: 0, color: 'from-amber-600 to-amber-800' },
  { level: 'Silver', minReferrals: 5, creditPerReferral: 20000, bonus: 50000, color: 'from-gray-400 to-gray-600' },
  { level: 'Gold', minReferrals: 10, creditPerReferral: 25000, bonus: 100000, color: 'from-yellow-400 to-yellow-600' },
  { level: 'Platinum', minReferrals: 20, creditPerReferral: 30000, bonus: 200000, color: 'from-purple-400 to-purple-600' }
];

export default function ReferralSystem() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedShare, setSelectedShare] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const referralLink = `https://tutienda.com/ref/${mockUser.referralCode}`;

  const formatPrice = (price: string | number | bigint) => {
    const numericPrice =
      typeof price === 'string' ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getCurrentTier = () => {
    return rewardTiers.find(tier => 
      mockUser.totalReferrals >= tier.minReferrals && 
      (rewardTiers.indexOf(tier) === rewardTiers.length - 1 || 
       mockUser.totalReferrals < rewardTiers[rewardTiers.indexOf(tier) + 1].minReferrals)
    );
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    if (!currentTier) return null;
    const currentIndex = rewardTiers.indexOf(currentTier);
    return currentIndex < rewardTiers.length - 1 ? rewardTiers[currentIndex + 1] : null;
  };

  const sendInvite = () => {
    // Aquí implementarías el envío del email
    console.log('Sending invite to:', inviteEmail, 'with message:', inviteMessage);
    alert('¡Invitación enviada correctamente!');
    setInviteEmail('');
    setInviteMessage('');
  };

  const shareOnPlatform = (
    platform: 'whatsapp' | 'facebook' | 'twitter' | 'email'
  ) => {
    const message = `¡Únete a nuestra tienda usando mi código de referido y obtén descuentos increíbles! ${referralLink}`;
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=¡Únete a nuestra tienda!&body=${encodeURIComponent(message)}`
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Sistema de Referidos
          </h1>
          <p className="text-lg md:text-xl text-blue-100">
            Invita amigos y gana créditos por cada compra que realicen
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Resumen', icon: TrendingUp },
              { id: 'invite', label: 'Invitar', icon: UserPlus },
              { id: 'referrals', label: 'Mis Referidos', icon: Users },
              { id: 'rewards', label: 'Recompensas', icon: Gift }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Coins className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">+{formatPrice(15000)}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(mockUser.availableCredits)}</h3>
                <p className="text-gray-600 text-sm">Créditos disponibles</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">+2 este mes</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{mockUser.totalReferrals}</h3>
                <p className="text-gray-600 text-sm">Total referidos</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">{mockUser.level}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {getCurrentTier() ? formatPrice(getCurrentTier()!.creditPerReferral) : ''}
                </h3>
                <p className="text-gray-600 text-sm">Por referido</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-600">{mockUser.nextLevelReferrals} más</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{getNextTier()?.level || 'Max'}</h3>
                <p className="text-gray-600 text-sm">Siguiente nivel</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-6">Progreso al siguiente nivel</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nivel actual: {getCurrentTier()?.level}</span>
                    <span className="text-blue-600 font-medium">{mockUser.totalReferrals} referidos</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${getCurrentTier() && getNextTier()
                          ? ((mockUser.totalReferrals - (getCurrentTier()?.minReferrals ?? 0)) /
                             ((getNextTier()?.minReferrals ?? 1) - (getCurrentTier()?.minReferrals ?? 0))) * 100
                          : 100}%`
                      }}
                    ></div>
                  </div>
                  
                  {getNextTier() && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        Siguiente: {getNextTier() ? getNextTier()!.level : ''}
                      </span>
                      <span className="text-gray-500">
                        {getNextTier() ? getNextTier()!.minReferrals : ''} referidos
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-6">Actividad reciente</h3>
                <div className="space-y-4">
                  {mockReferrals.slice(0, 3).map((referral) => (
                    <div key={referral.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{referral.name}</p>
                        <p className="text-sm text-gray-500">
                          {referral.status === 'active' ? 'Realizó una compra' : 'Se registró'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+{formatPrice(referral.creditsEarned)}</p>
                        <p className="text-xs text-gray-500">{referral.joinDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Tab */}
        {activeTab === 'invite' && (
          <div className="space-y-8">
            {/* Your Referral Code */}
            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu código de referido</h2>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{mockUser.referralCode}</div>
                  <div className="text-gray-600 break-all">{referralLink}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? '¡Copiado!' : 'Copiar enlace'}
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-6">Compartir en redes sociales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => shareOnPlatform('whatsapp')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => shareOnPlatform('facebook')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">Facebook</span>
                  </button>

                  <button
                    onClick={() => shareOnPlatform('twitter')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                      <Twitter className="w-5 h-5 text-sky-600" />
                    </div>
                    <span className="font-medium text-gray-700">Twitter</span>
                  </button>

                  <button
                    onClick={() => shareOnPlatform('email')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-700">Email</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-6">Invitación personalizada</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email del amigo
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="amigo@ejemplo.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje personalizado (opcional)
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="¡Hola! Te invito a conocer esta increíble tienda..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={sendInvite}
                    disabled={!inviteEmail}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Enviar invitación
                  </button>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">¿Cómo funciona?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">1. Comparte tu código</h4>
                  <p className="text-gray-600">Envía tu código único a amigos y familiares</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">2. Ellos se registran</h4>
                  <p className="text-gray-600">Tus amigos usan tu código al crear su cuenta</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">3. Ganas créditos</h4>
                  <p className="text-gray-600">Recibe créditos por cada compra que realicen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold">Mis Referidos ({mockReferrals.length})</h3>
                <p className="text-gray-600 mt-1">Seguimiento de todos tus referidos y sus actividades</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Referido</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Fecha de registro</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Compras</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Total gastado</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Créditos ganados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{referral.name}</p>
                            <p className="text-sm text-gray-500">{referral.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {referral.status === 'active' ? 'Activo' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {new Date(referral.joinDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {referral.purchases}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {formatPrice(referral.totalSpent)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-green-600">
                            {formatPrice(referral.creditsEarned)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-8">
            {/* Current Tier */}
            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sistema de Niveles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewardTiers.map((tier, index) => (
                  <div
                    key={tier.level}
                    className={`relative rounded-xl p-6 border-2 transition-all duration-200 ${
                      getCurrentTier()?.level === tier.level
                        ? 'border-blue-500 bg-blue-50'
                        : mockUser.totalReferrals >= tier.minReferrals
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {getCurrentTier()?.level === tier.level && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Nivel actual
                        </span>
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 bg-gradient-to-r ${tier.color} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{tier.level}</h3>
                      <p className="text-sm text-gray-600 mb-4">{tier.minReferrals}+ referidos</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="w-4 h-4 text-blue-600" />
                          <span>{formatPrice(tier.creditPerReferral)} por referido</span>
                        </div>
                        {tier.bonus > 0 && (
                          <div className="flex items-center justify-center gap-2">
                            <Gift className="w-4 h-4 text-purple-600" />
                            <span>Bono: {formatPrice(tier.bonus)}</span>
                          </div>
                        )}
                      </div>
                      
                      {mockUser.totalReferrals >= tier.minReferrals && (
                        <div className="mt-4">
                          <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit History */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold">Historial de créditos</h3>
                <p className="text-gray-600 mt-1">Todos los créditos que has ganado</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {mockReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Gift className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Referido: {referral.name}</p>
                          <p className="text-sm text-gray-500">
                            {referral.status === 'active' ? 'Compra realizada' : 'Registro completado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{formatPrice(referral.creditsEarned)}</p>
                        <p className="text-xs text-gray-500">{referral.joinDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Redeem Credits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-6">Usar mis créditos</h3>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatPrice(mockUser.availableCredits)}
                  </div>
                  <p className="text-gray-600">Créditos disponibles</p>
                </div>
                
                <div className="space-y-4">
                  <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Usar en mi próxima compra
                  </button>
                  <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    Ver términos y condiciones
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                <h3 className="text-xl font-semibold mb-4">¡Próximo a alcanzar {getNextTier()?.level || 'nivel máximo'}!</h3>
                {getNextTier() ? (
                  <>
                    <p className="mb-6">
                      Solo necesitas {getNextTier() && getNextTier()!.minReferrals ? getNextTier()!.minReferrals - mockUser.totalReferrals : 0} referidos más para subir de nivel
                      y ganar {getNextTier() && getNextTier()!.creditPerReferral ? formatPrice(getNextTier()!.creditPerReferral) : ''} por cada referido.
                    </p>
                    <div className="bg-white/20 rounded-lg p-4 mb-6">
                      <p className="text-sm mb-2">
                        Progreso: {mockUser.totalReferrals} / {getNextTier() && getNextTier()!.minReferrals ? getNextTier()!.minReferrals : 0}
                      </p>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              getNextTier() && getNextTier()!.minReferrals
                                ? (mockUser.totalReferrals / getNextTier()!.minReferrals) * 100
                                : 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('invite')}
                      className="bg-white text-purple-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      Invitar más amigos
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-6">
                      ¡Felicitaciones! Has alcanzado el nivel máximo de nuestro sistema de referidos.
                    </p>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6" />
                      <span className="font-bold">Nivel Platinum</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Terms and Benefits */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-6">Términos y beneficios del programa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Beneficios
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Créditos por cada referido que se registre</li>
                    <li>• Créditos adicionales por cada compra de tus referidos</li>
                    <li>• Bonos especiales al subir de nivel</li>
                    <li>• Los créditos nunca expiran</li>
                    <li>• Acceso a ofertas exclusivas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Condiciones
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Los créditos se acreditan tras la primera compra del referido</li>
                    <li>• Mínimo de compra de $50.000 para generar créditos</li>
                    <li>• Los créditos pueden usarse hasta un 50% del valor total</li>
                    <li>• No aplica en productos con descuento mayor al 30%</li>
                    <li>• Un referido debe ser un usuario nuevo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 mb-8 bg-white rounded-xl p-8 shadow-sm border">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Preguntas Frecuentes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Cuándo recibo mis créditos?</h4>
                <p className="text-gray-600">Los créditos se acreditan automáticamente cuando tu referido realiza su primera compra.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Los créditos expiran?</h4>
                <p className="text-gray-600">No, tus créditos nunca expiran y puedes usarlos cuando gustes.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Puedo referir a familiares?</h4>
                <p className="text-gray-600">Sí, puedes referir a cualquier persona que no tenga una cuenta existente.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Hay límite de referidos?</h4>
                <p className="text-gray-600">No hay límite, puedes invitar a tantas personas como quieras.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Cómo uso mis créditos?</h4>
                <p className="text-gray-600">Puedes aplicar tus créditos durante el proceso de pago como descuento.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">¿Puedo transferir créditos?</h4>
                <p className="text-gray-600">Los créditos son personales e intransferibles.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mb-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            ¡Empieza a ganar créditos hoy!
          </h3>
          <p className="text-lg mb-8 text-blue-100">
            Comparte tu código con amigos y familiares y obtén recompensas por cada compra
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setActiveTab('invite')}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              Invitar amigos
            </button>
            <button 
              onClick={() => copyToClipboard(referralLink)}
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Copiar mi enlace
            </button>
          </div>
        </div>
      </div>
      <div className="mb-18 lg:mb-0">
              <Footer />
          </div>
    </div>
  );
}