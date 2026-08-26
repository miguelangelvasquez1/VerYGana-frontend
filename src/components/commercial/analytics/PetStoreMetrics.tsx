'use client';

import React, { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { PawPrint, Coins, Users, Repeat } from 'lucide-react';
import { MetricStatCard } from './MetricStatCard';
import type { DateRangeFilter } from './analytics.types';
import {
  getMyPetDailySales,
  getMyPetProductMetrics,
  type PetProductMetrics,
  type PetSalesPoint,
} from '@/services/PetRequestService';

const money = (cents: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(cents / 100);

/** dd/MM para el eje, que es lo que cabe sin girar las etiquetas. */
const shortDay = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—';

/**
 * Ventas de los productos del comercial dentro del juego de mascotas.
 *
 * Solo ventas: el juego no manda eventos de visualización, así que no hay
 * impresiones ni conversión. El texto de la sección lo dice explícitamente porque
 * quien ve un panel de métricas asume que mide alcance.
 */
export function PetStoreMetrics({ dateRange }: { dateRange: DateRangeFilter }) {
  const [products, setProducts] = useState<PetProductMetrics[]>([]);
  const [series, setSeries] = useState<PetSalesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      getMyPetProductMetrics(dateRange, controller.signal),
      getMyPetDailySales(dateRange, controller.signal),
    ])
      .then(([p, s]) => { setProducts(p); setSeries(s); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError('No pudimos cargar las métricas de la tienda de mascotas.');
        console.error(err);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [dateRange]);

  const totals = products.reduce(
    (acc, p) => ({
      units: acc.units + p.unitsSold,
      revenue: acc.revenue + p.revenueCents,
      buyers: acc.buyers + p.uniqueBuyers,
      repeat: acc.repeat + p.repeatBuyers,
    }),
    { units: 0, revenue: 0, buyers: 0, repeat: 0 },
  );

  // Los compradores únicos se suman por producto: quien compró dos productos
  // distintos cuenta dos veces. Se avisa en el subtítulo para no dar una cifra
  // de alcance que no es.
  const chartData = series.map((p) => ({ dia: shortDay(p.date), unidades: p.unitsSold }));
  const conVentas = series.some((p) => p.unitsSold > 0);

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
      Cargando métricas de mascotas…
    </div>;
  }

  if (error) {
    return <div className="bg-white rounded-lg shadow-sm border border-red-100 p-6 text-sm text-red-600">
      {error}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricStatCard
          title="Unidades vendidas" value={totals.units.toLocaleString('es-CO')}
          icon={PawPrint} subtitle="En la tienda del juego"
        />
        <MetricStatCard
          title="Ingreso" value={money(totals.revenue)}
          icon={Coins} subtitle="Llaves gastadas por los jugadores"
        />
        <MetricStatCard
          title="Compradores" value={totals.buyers.toLocaleString('es-CO')}
          icon={Users} subtitle="Suma por producto"
        />
        <MetricStatCard
          title="Volvieron a comprar" value={totals.repeat.toLocaleString('es-CO')}
          icon={Repeat} subtitle="Compraron el mismo producto más de una vez"
        />
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">
            Todavía no tienes productos publicados en el juego. Cuando una solicitud de
            integración se apruebe, su rendimiento aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold text-right">Precio</th>
                  <th className="px-4 py-3 font-semibold text-right">Unidades</th>
                  <th className="px-4 py-3 font-semibold text-right">Ingreso</th>
                  <th className="px-4 py-3 font-semibold text-right">Compradores</th>
                  <th className="px-4 py-3 font-semibold text-right">Última venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.catalogItemId} className={p.unitsSold === 0 ? 'text-gray-400' : ''}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.productName}</span>
                      {!p.active && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                          inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.priceKeys != null ? `${p.priceKeys} llaves` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">{p.unitsSold}</td>
                    <td className="px-4 py-3 text-right">{money(p.revenueCents)}</td>
                    <td className="px-4 py-3 text-right">{p.uniqueBuyers}</td>
                    <td className="px-4 py-3 text-right">{fecha(p.lastSale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.some((p) => p.unitsSold === 0) && (
            <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400">
              Los productos en gris están publicados pero aún no registran ventas en este periodo.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900">Unidades vendidas por día</h4>
        {conVentas ? (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="unidades" fill="#03548C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Sin ventas en este periodo.
          </p>
        )}
      </div>
    </div>
  );
}
