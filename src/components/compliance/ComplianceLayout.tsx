'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, AlertTriangle, ScrollText, FileSignature, Menu, X, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';

const navItems = [
  {
    title: 'Revisión KYC',
    href: '/compliance/kyc',
    icon: ShieldCheck,
    color: 'text-blue-500',
  },
  {
    title: 'Alertas de Screening',
    href: '/compliance/screenings',
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  {
    title: 'Contratos comerciales',
    href: '/compliance/contracts',
    icon: FileSignature,
    color: 'text-emerald-500',
  },
  {
    title: 'Logs de Auditoría',
    href: '/compliance/audit-logs',
    icon: ScrollText,
    color: 'text-purple-500',
  },
];

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useLogout();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg h-screen transition-all duration-300 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b h-16">
          {!collapsed && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Portal</p>
              <h2 className="text-base font-bold text-gray-800 leading-tight">Cumplimiento</h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="mt-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                  className={`${isActive ? 'text-blue-500' : item.color} ${collapsed ? '' : 'mr-3'}`}
                />
                {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={logout}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${collapsed ? 'justify-center' : 'gap-3'}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-16 flex items-center shrink-0">
          <h1 className="text-sm font-semibold text-gray-500">
            Portal del Oficial de Cumplimiento
          </h1>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
