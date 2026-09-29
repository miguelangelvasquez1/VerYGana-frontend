import React from "react";
import Link from "next/link";
import { Star, Package } from "lucide-react";

import { DashboardTopProduct } from "@/types/commercial/Dashboard.types";
import { formatCount, formatPesosToCOP } from "./dashboard.format";
import { DashboardCard, EmptyState, SectionTitle } from "./dashboard.ui";

export function TopProductsCard({
  products,
}: {
  products: DashboardTopProduct[];
}) {
  return (
    <DashboardCard>
      <SectionTitle
        title="Top productos"
        subtitle="Los más vendidos del periodo"
      />
      {products.length === 0 ? (
        <EmptyState message="Aún no hay productos con ventas en este periodo." />
      ) : (
        <ul className="divide-y divide-gray-50">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-3 py-2.5">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/commercial/products/${product.id}`}
                  className="block truncate text-sm font-medium text-gray-900 hover:text-[#03548C]"
                >
                  {product.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatPesosToCOP(product.price)}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {product.averageRate.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCount(product.totalSales)}
                </p>
                <p className="text-xs text-gray-400">ventas</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
