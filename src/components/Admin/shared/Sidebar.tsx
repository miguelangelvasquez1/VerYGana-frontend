'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Gift,
  Settings,
  BarChart3,
  Menu,
  X,
  Home,
  Shield,
  DollarSign,
  Bell,
  MonitorSmartphone
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/admin',
      color: 'text-blue-500'
    },
    {
      title: 'Usuarios',
      icon: Users,
      href: '/admin/users',
      color: 'text-green-500'
    },
    {
      title: 'Anuncios',
      icon: MonitorSmartphone,
      href: '/admin/ads',
      color: 'text-green-500'
    },
    {
      title: 'Rifas',
      icon: Gift,
      href: '/admin/raffles',
      color: 'text-purple-500'
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'text-orange-500'
    },
    {
      title: 'Finanzas',
      icon: DollarSign,
      href: '/admin/finance',
      color: 'text-emerald-500'
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      href: '/admin/notifications',
      color: 'text-yellow-500'
    },
    {
      title: 'Sistema',
      icon: Shield,
      href: '/admin/system',
      color: 'text-red-500'
    },
    {
      title: 'Configuración',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className={`bg-white shadow-lg h-screen transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b h-18">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon 
                size={20} 
                className={`${isActive ? 'text-blue-500' : item.color} ${isCollapsed ? '' : 'mr-3'}`}
              />
              {!isCollapsed && (
                <span className="font-medium">{item.title}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <p className="text-sm font-medium">Panel de Administración</p>
            <p className="text-xs opacity-90">Gestiona tu sistema completo</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;