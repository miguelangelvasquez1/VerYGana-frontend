// app/(dashboard)/dashboard/page.tsx

'use client';
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { StatsCards } from '@/components/advertiser/dashboard/StatsCards';
import { PerformanceChart } from '@/components/advertiser/dashboard/PerformanceChart';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {

  // const { user, role, isAuthenticated } = useAuth();

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-600">
            {/* {`Bienvenido de vuelta ${typeof user === 'string' ? user : user?.email ?? 'usuario'}. Aquí tienes un resumen de tu actividad publicitaria.`} */}
          </p>
        </div>
        
        <StatsCards />
        <PerformanceChart />

        {/* Resumen de anuncios recientes */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Anuncio "Promoción Black Friday" aprobado</p>
                <p className="text-sm text-gray-600">Hace 2 horas</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Aprobado
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Campaña "Verano 2024" pausada automáticamente</p>
                <p className="text-sm text-gray-600">Hace 4 horas - Presupuesto agotado</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Pausado
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Saldo recargado con $500.00</p>
                <p className="text-sm text-gray-600">Hace 1 día</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Recarga
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}