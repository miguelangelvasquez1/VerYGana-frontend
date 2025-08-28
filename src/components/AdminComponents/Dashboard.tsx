// components/admin/Dashboard.tsx
'use client';

import React from 'react';
import { 
  Users, 
  Gift, 
  DollarSign, 
  TrendingUp,
  Activity,
  Calendar,
  Trophy,
  AlertCircle 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Usuarios',
      value: '2,847',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Rifas Activas',
      value: '24',
      change: '+3',
      changeType: 'positive',
      icon: Gift,
      color: 'purple'
    },
    {
      title: 'Ingresos Mes',
      value: '$48,250,000',
      change: '+8.2%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Tickets Vendidos',
      value: '15,642',
      change: '+15.3%',
      changeType: 'positive',
      icon: Trophy,
      color: 'orange'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'user_registered',
      message: 'Nuevo usuario registrado: María González',
      time: 'Hace 5 minutos',
      icon: Users,
      color: 'blue'
    },
    {
      id: 2,
      type: 'raffle_created',
      message: 'Nueva rifa creada: "MacBook Pro M3"',
      time: 'Hace 15 minutos',
      icon: Gift,
      color: 'purple'
    },
    {
      id: 3,
      type: 'payment_received',
      message: 'Pago recibido: $250,000 COP',
      time: 'Hace 23 minutos',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 4,
      type: 'system_alert',
      message: 'Alta carga en el servidor de pagos',
      time: 'Hace 1 hora',
      icon: AlertCircle,
      color: 'red'
    }
  ];

  const topRaffles = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      sold: 850,
      total: 1000,
      revenue: '$42,500,000'
    },
    {
      id: 2,
      title: 'Viaje a Europa',
      sold: 320,
      total: 500,
      revenue: '$32,000,000'
    },
    {
      id: 3,
      title: 'Tesla Model 3',
      sold: 450,
      total: 800,
      revenue: '$22,500,000'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">¡Bienvenido al Panel de Administración!</h1>
        <p className="text-blue-100">Aquí tienes un resumen de la actividad de tu sistema</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Sistema: Operativo</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                  <p className={`text-sm mt-2 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} desde el mes pasado
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getColorClasses(activity.color)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver toda la actividad →
            </button>
          </div>
        </div>

        {/* Top Performing Raffles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Rifas Destacadas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topRaffles.map((raffle) => (
                <div key={raffle.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900">{raffle.title}</h4>
                    <span className="text-xs text-gray-500">{raffle.sold}/{raffle.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(raffle.sold / raffle.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {Math.round((raffle.sold / raffle.total) * 100)}% vendido
                    </span>
                    <span className="text-xs font-medium text-green-600">{raffle.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas las rifas →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Gift className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900">Nueva Rifa</h4>
              <p className="text-sm text-gray-600">Crear una nueva rifa</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Gestionar Usuarios</h4>
              <p className="text-sm text-gray-600">Ver y editar usuarios</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
              <h4 className="font-medium text-gray-900">Ver Reportes</h4>
              <p className="text-sm text-gray-600">Analizar métricas</p>
            </button>
            
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
              <Activity className="h-8 w-8 text-red-600 mb-2" />
              <h4 className="font-medium text-gray-900">Configuración</h4>
              <p className="text-sm text-gray-600">Ajustes del sistema</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;