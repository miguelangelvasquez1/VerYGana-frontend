import React from "react";
import Link from "next/link";
import { Star, Building2 } from "lucide-react";
import { ProductResponseDTO } from "@/types/products/Product.types";

interface Props {
  product: ProductResponseDTO;
  footer?: React.ReactNode;
}

const ProductInfoCard: React.FC<Props> = ({ product, footer }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      <div
        className="h-1.5 w-full shrink-0"
        style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
      />

      <div className="p-6 space-y-5 flex flex-col flex-1">
        <span
          className="inline-block text-white text-sm font-semibold px-3 py-1 rounded-full w-fit"
          style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
        >
          {product.categoryName}
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>

        {product.companyName && (
          <Link
            href={`/commercial/${product.commercialId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-700 transition group"
          >
            <Building2 className="w-4 h-4 shrink-0 group-hover:text-blue-600 transition" />
            <span className="underline-offset-2 group-hover:underline">{product.companyName}</span>
          </Link>
        )}

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < product.averageRate
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {product.averageRate} ({product.reviewCount} reseñas)
          </span>
        </div>

        <div className="text-3xl font-extrabold" style={{ color: "#014C92" }}>
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(product.price)}
        </div>

        <p className="text-gray-600 leading-relaxed text-sm">
          {product.description}
        </p>

        <span
          className={`inline-block text-sm font-semibold px-3 py-1 rounded-full w-fit ${
            product.stock > 10
              ? "bg-green-100 text-green-700"
              : product.stock > 0
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {product.stock > 0
            ? `${product.stock} unidades disponibles`
            : "Sin stock"}
        </span>

        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </div>
  );
};

export default ProductInfoCard;
