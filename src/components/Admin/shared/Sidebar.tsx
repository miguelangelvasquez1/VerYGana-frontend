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
  DollarSign,
  Bell,
  MonitorSmartphone,
  MessageSquare,
  TargetIcon,
  Palette,
  Headset,
  ShieldAlert,
  PawPrint,
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: any;
  href: string;
}

interface MenuGroup {
  section?: string;
  items: MenuItem[];
}

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = [
    {
      items: [
        {
          title: 'Dashboard',
          icon: Home,
          href: '/admin',
        }
      ]
    },
    {
      section: 'Gestión',
      items: [
        {
          title: 'Usuarios',
          icon: Users,
          href: '/admin/users',
        },
        {
          title: 'Anuncios',
          icon: MonitorSmartphone,
          href: '/admin/ads',
        },
        {
          title: 'Branding',
          icon: Palette,
          href: '/admin/branding',
        },
        {
          title: 'Mascotas',
          icon: PawPrint,
          href: '/admin/pet-requests',
          color: 'text-pink-500'
        },
        {
          title: 'Productos',
          icon: TargetIcon,
          href: '/admin/products',
        },
        {
      title: 'Rifas',
      icon: Gift,
      href: '/admin/raffles',
    },
    {
      title: 'Encuestas',
      icon: BarChart3,
      href: '/admin/surveys',
    },
    {
      title: 'Foro',
      icon: MessageSquare,
      href: '/admin/forum',
    },
    {
      title: 'PQRS',
      icon: Headset,
      href: '/admin/pqrs',
    },
    {
      title: 'Eventos de seguridad',
      icon: ShieldAlert,
      href: '/admin/security-events',
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      href: '/admin/reports',
    },
    {
      title: 'Finanzas',
      icon: DollarSign,
      href: '/admin/finance',
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      href: '/admin/notifications',
    },
    {
      title: 'Configuración',
      icon: Settings,
      href: '/admin/config',
    }
      ]
    },
  ];

  return (
    <div
      className={`bg-[#041521] shadow-lg h-screen transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.07] h-18">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src="/logos/logoDorado.png"
              alt="VERyGANA"
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="leading-tight">
              <p className="text-base font-extrabold text-white tracking-tight">VERyGANA</p>
              <p className="text-[10px] text-white/40 font-medium tracking-wide">Panel administrativo</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index}>
            {group.section && !isCollapsed && (
              <p className="px-4 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                {group.section}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 mx-2 rounded-lg border-r-4 whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 border-admin-gold text-white'
                      : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 ${isActive ? 'text-admin-gold' : 'text-admin-blue'} ${
                      isCollapsed ? '' : 'mr-3'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
