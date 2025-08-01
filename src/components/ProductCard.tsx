import React from 'react';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-2xl shadow-md p-4 w-full max-w-xs bg-white">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover rounded-xl mb-4"
      />
      <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
      <p className="text-gray-700 font-medium mb-1">💲 {product.price}</p>
      <p className="text-sm text-gray-600">Stock: {product.stock}</p>
      <span
        className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${
          product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {product.isActive ? 'Disponible' : 'No disponible'}
      </span>
    </div>
  );
};

export default ProductCard;
