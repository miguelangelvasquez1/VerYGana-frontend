"use client";

import { useEffect, useState } from "react";
import { getFavorites, countFavorites } from "@/services/ProductService";
import ProductCard from "@/components/products/ProductCard";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";

export default function FavoritesPage() {
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const [favorites, total] = await Promise.all([
        getFavorites(0),
        countFavorites(),
      ]);

      setProducts(favorites.data); 
      setCount(total);
    };

    load();
  }, []);

  return (
    <>
      <Navbar />

      {/* ===== Main content ===== */}
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          
          {/* ===== Header ===== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              ❤️ Mis favoritos
              <span className="text-sm sm:text-base font-medium text-gray-500">
                ({count})
              </span>
            </h1>
          </div>

          {/* ===== Empty state ===== */}
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl mb-4">💔</span>
              <p className="text-lg text-gray-600">
                Aún no tienes productos favoritos
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Explora el marketplace y guarda los que más te gusten
              </p>
            </div>
          )}

          {/* ===== Products grid ===== */}
          {products.length > 0 && (
            <div className="
              grid 
              grid-cols-1 
              sm:grid-cols-2 
              md:grid-cols-3 
              xl:grid-cols-4 
              gap-6
            ">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="consumer"
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
