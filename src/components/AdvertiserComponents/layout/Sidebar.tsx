// components/layout/Sidebar.tsx (Versión actualizada y responsive)
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
  FileImage,
  Home,
  PlusCircle,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  X,
  LogOut
} from 'lucide-react';

const menuItems = [
  { href: '/advertiser', icon: Home, label: 'Dashboard' },
  { href: '/advertiser/ads', icon: FileImage, label: 'Mis Anuncios' },
  { href: '/advertiser/ads/create', icon: PlusCircle, label: 'Crear Anuncio' },
  { href: '/advertiser/campaigns', icon: Target, label: 'Campañas' },
  { href: '/advertiser/analytics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/advertiser/billing', icon: CreditCard, label: 'Facturación' },
  { href: '/advertiser/balance', icon: Wallet, label: 'Mi Saldo' },
  { href: '/advertiser/settings', icon: Settings, label: 'Configuración' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="bg-gray-900 text-white w-64 h-screen flex flex-col shadow-lg">
      {/* Header del sidebar */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">AdManager</h1>
            <p className="text-gray-400 text-sm mt-1">Panel de Advertiser</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose} // Cerrar sidebar en móvil al hacer click
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Saldo y información */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Saldo Actual</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">$1,250.00</p>
          <p className="text-xs text-gray-400 mt-1">Última recarga hace 2 días</p>
          <div className="mt-3">
            <Link 
              href="/balance"
              onClick={onClose}
              className="block text-center bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Recargar Saldo
            </Link>
          </div>
        </div>

        {/* Botón de logout */}
        <button className="w-full flex items-center px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}