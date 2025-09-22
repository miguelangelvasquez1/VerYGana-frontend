'use client'
import { useState, useEffect, useMemo } from "react";
import { Filter, Grid3X3, List, ChevronDown, Star, ShoppingCart } from "lucide-react";
import Navbar from "@/components/bars/NavBar";
import CategoryCard from "@/components/ProductsPage/CategoryCard";
import ProductCard from "@/components/ProductsPage/ProductCard";
import SearchBar from "@/components/ProductsPage/SearchBar";
import ProductModal from "@/components/ProductsPage/ProductModal";
import InfiniteScroll from "@/components/ProductsPage/InfiniteScroll";
import Footer from "@/components/Footer";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const products = [
  {
    id: "1",
    name: "Camiseta de manga corta de cuello redondo para hombre",
    imageUrl: "/products/camiseta.png",
    image: "/products/camiseta.png",
    date: '2024-06-02',
    price: 40000,
    originalPrice: 50000,
    stock: 1000,
    isActive: true,
    rating: 4.5,
    reviews: 128,
    category: "Ropa de hombre",
    discount: 20,
    isNew: false,
    isFeatured: true,
    description: "Camiseta clásica de algodón 100% premium, perfecta para el uso diario. Diseño moderno y cómodo que se adapta a cualquier ocasión casual."
  },
  {
    id: "2",
    name: "Casco Edge Integral Shanghai Quartz Dot Y Ece 2206",
    imageUrl: "/products/casco.png",
    image: "/products/casco.png",
    date: '2024-06-02',
    price: 327000,
    originalPrice: 327000,
    stock: 0,
    isActive: false,
    rating: 4.8,
    reviews: 89,
    category: "Deporte",
    discount: 0,
    isNew: false,
    isFeatured: false,
    description: "Casco integral de alta seguridad con certificación DOT y ECE 2206. Construcción robusta con tecnología avanzada para máxima protección."
  },
  {
    id: "3",
    name: "Anillos Pareja Plata 925 Mujer Hombre Elegantes Compromiso",
    imageUrl: "/products/anillos.png",
    image: "/products/anillos.png",
    date: '2024-06-02',
    price: 26400,
    originalPrice: 33000,
    stock: 57,
    isActive: true,
    rating: 4.7,
    reviews: 234,
    category: "Joyería",
    discount: 15,
    isNew: true,
    isFeatured: true,
    description: "Hermosos anillos de plata 925 para parejas, diseño elegante y romántico perfecto para compromisos y aniversarios especiales."
  },
  // Agregando más productos para demostrar el scroll infinito
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `${i + 4}`,
    name: `Producto ${i + 4} - ${['Deportivo', 'Casual', 'Elegante', 'Moderno'][i % 4]}`,
    imageUrl: ['/products/camiseta.png', '/products/casco.png', '/products/anillos.png', '/products/balon.png'][i % 4],
    image: ['/products/camiseta.png', '/products/casco.png', '/products/anillos.png', '/products/balon.png'][i % 4],
    date: '2024-06-01',
    price: Math.floor(Math.random() * 300000) + 10000,
    originalPrice: Math.floor(Math.random() * 400000) + 15000,
    stock: Math.floor(Math.random() * 100),
    isActive: Math.random() > 0.1,
    rating: 4 + Math.random(),
    reviews: Math.floor(Math.random() * 500) + 10,
    category: ['Deporte', 'Ropa de hombre', 'Ropa de mujer', 'Joyería', 'Papelería', 'Tecnología'][i % 6],
    discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : 0,
    isNew: Math.random() > 0.8,
    isFeatured: Math.random() > 0.9,
    description: `Descripción detallada del producto ${i + 4}. Un artículo de alta calidad con características premium y diseño moderno.`
  }))
];

const categories = [
  {
    id: "1",
    name: "Deporte",
    imageUrl: "/categories/deporte.jpg",
    productCount: products.filter(p => p.category === "Deporte").length,
  },
  {
    id: "2",
    name: "Juguetería",
    imageUrl: "/categories/juguetes.jpg",
    productCount: products.filter(p => p.category === "Juguetería").length,
  },
  {
    id: "3",
    name: "Servicios", 
    imageUrl: "/categories/servicios.jpg",
    productCount: products.filter(p => p.category === "Servicios").length,
  },
  {
    id: "4",
    name: "Tecnología",
    imageUrl: "/categories/iphone13.jpg",
    productCount: products.filter(p => p.category === "Tecnología").length,
  },
  {
    id: "5",
    name: "Papelería",
    imageUrl: "/categories/papeleria.webp",
    productCount: products.filter(p => p.category === "Papelería").length,
  },
  {
    id: "6",
    name: "Joyería",
    imageUrl: "/categories/joyeria.webp",
    productCount: products.filter(p => p.category === "Joyería").length,
  }
];

export default function ProductsPage() {
  // Estados para filtros
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtrar por categoría
    if (selectedCategory !== "Todos") {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Filtrar por precio
    result = result.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "featured":
      default:
        result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
    }

    return result;
  }, [selectedCategory, sortBy, priceRange, searchTerm]);

  // Hook de scroll infinito
  const { displayedItems, loading, hasMore, loadMore } = useInfiniteScroll({
    items: filteredProducts,
    itemsPerPage: 12,
  });

  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === "string" ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <Navbar />

      {/* Hero Section con Search */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Descubre Productos Increíbles
          </h1>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            Encuentra todo lo que necesitas al mejor precio
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categorías */}
        <section className="mb-16 mt-15">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Categorías</h2>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Ver todas →
            </button>
          </div>

          {/* Grid responsivo de categorías */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`cursor-pointer transition-all duration-200 ${selectedCategory === category.name
                    ? 'ring-2 ring-blue-500 scale-105'
                    : 'hover:scale-105 hover:shadow-lg'
                  }`}
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </section>

        {/* Filtros y Controles */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border">
            {/* Filtros izquierda */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Categoría:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Todos">Todos</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controles derecha */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-low">Menor precio</option>
                  <option value="price-high">Mayor precio</option>
                  <option value="rating">Mejor valorados</option>
                  <option value="newest">Más nuevos</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l pl-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mt-4 p-6 bg-gray-50 rounded-xl border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rango de precio: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Estado</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Con stock</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">En oferta</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Valoración mínima</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-400 cursor-pointer hover:text-yellow-500" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Aplicar filtros
                </button>
                <button 
                  onClick={() => {
                    setSelectedCategory("Todos");
                    setSearchTerm("");
                    setPriceRange([0, 500000]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Productos con Scroll Infinito */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Productos</h2>
              <p className="text-gray-600 mt-1">
                {filteredProducts.length} productos encontrados
                {selectedCategory !== "Todos" && ` en ${selectedCategory}`}
              </p>
            </div>
          </div>

          {/* Estado vacío */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar tus filtros o buscar algo diferente
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("Todos");
                  setSearchTerm("");
                  setPriceRange([0, 500000]);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <InfiniteScroll
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              threshold={300}
            >
              {/* Grid de productos */}
              <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : 'grid-cols-1'
                }`}>
                {displayedItems.map((product) => (
                  <div key={product.id} className="group">
                    <ProductCard 
                      product={product} 
                      viewMode={viewMode}
                      onProductClick={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      </div>

      {/* Modal de producto */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <div className="mb-18 lg:mb-0">
        <Footer />
      </div>
    </>
  );
}