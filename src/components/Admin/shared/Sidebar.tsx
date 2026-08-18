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
  color?: string;
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
        },
      ],
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
          color: 'text-pink-500',
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
        },
      ],
    },
  ];

  return (
      <aside
          className={`bg-[#041521] shadow-lg h-screen flex flex-col transition-all duration-300 shrink-0 ${
              isCollapsed
                  ? 'w-16 xl:w-20'
                  : 'w-64 xl:w-72 2xl:w-80'
          } ${className}`}
      >
        {/* Header Fijo adaptativo */}
        <div className="flex items-center justify-between p-4 xl:p-5 border-b border-white/[0.07] h-16 xl:h-20 shrink-0">
          {!isCollapsed && (
              <div className="flex items-center gap-2.5 xl:gap-3 overflow-hidden">
                <img
                    src="/logos/logoDorado.png"
                    alt="VERyGANA"
                    className="w-8 h-8 xl:w-10 xl:h-10 object-contain shrink-0"
                />
                <div className="leading-tight truncate">
                  <p className="text-base xl:text-lg 2xl:text-xl font-extrabold text-white tracking-tight">
                    VERyGANA
                  </p>
                  <p className="text-[10px] xl:text-xs text-white/40 font-medium tracking-wide">
                    Panel administrativo
                  </p>
                </div>
              </div>
          )}
          <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer ${
                  isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? <Menu className="w-5 h-5 xl:w-6 xl:h-6" /> : <X className="w-5 h-5 xl:w-6 xl:h-6" />}
          </button>
        </div>

        {/* Navegación con Scroll y Tamaños Dinámicos */}
        <div className="flex-1 overflow-y-auto py-3 px-2 xl:py-4 xl:px-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          <nav className="space-y-4 xl:space-y-6">
            {menuGroups.map((group, index) => (
                <div key={index} className="space-y-1 xl:space-y-1.5">
                  {group.section && !isCollapsed && (
                      <p className="px-3 py-1.5 text-[11px] xl:text-xs 2xl:text-sm font-bold text-white/40 uppercase tracking-wider">
                        {group.section}
                      </p>
                  )}

                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.title : undefined}
                            className={`flex items-center px-3 py-2.5 xl:px-4 xl:py-3 rounded-lg border-r-4 whitespace-nowrap text-sm xl:text-base 2xl:text-lg font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-white/10 border-admin-gold text-white font-semibold'
                                    : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <Icon
                              className={`shrink-0 w-5 h-5 xl:w-6 xl:h-6 ${
                                  isActive
                                      ? 'text-admin-gold'
                                      : item.color || 'text-admin-blue'
                              } ${isCollapsed ? 'mx-auto' : 'mr-3 xl:mr-4'}`}
                          />
                          {!isCollapsed && (
                              <span className="truncate">{item.title}</span>
                          )}
                        </Link>
                    );
                  })}
                </div>
            ))}
          </nav>
        </div>
      </aside>
  );
};

export default Sidebar;
