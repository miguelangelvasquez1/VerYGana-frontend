// components/layout/Header.tsx
'use client';

import React from 'react';
import { Menu, Bell, User, Search } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export function Header({ title, onMenuClick, showMenuButton }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showMenuButton && (
              <button
                id="menu-button"
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            
            {title && (
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Barra de búsqueda - oculta en móvil */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar anuncios..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notificaciones */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Perfil de usuario */}
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-gray-900">Juan Pérez</p>
                <p className="text-xs text-gray-600">Advertiser Pro</p>
              </div>
              <button className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                <User className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}