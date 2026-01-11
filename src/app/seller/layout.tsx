"use client";

import { Package, Plus, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6 border-b">
          <h1 className="font-bold text-gray-900">VeryGana</h1>
          <p className="text-xs text-gray-500">Panel Seller</p>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem icon={<BarChart3 />} label="Dashboard" href="/seller" />
          <NavItem icon={<Package />} label="Productos" href="/seller?section=products" />
          <NavItem icon={<Plus />} label="Publicar producto" href="/seller?section=create" />
          <NavItem icon={<TrendingUp />} label="Análisis" href="/seller?section=analytics" />
          <NavItem icon={<Wallet />} label="Retiros" href="/seller?section=withdrawals" />
        </nav>
      </aside>

      {/* Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
    >
      {icon}
      {label}
    </Link>
  );
}
