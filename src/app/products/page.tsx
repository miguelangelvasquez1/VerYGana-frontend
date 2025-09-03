'use client'
import { useState, useEffect } from "react";
import { Filter, Grid3X3, List, ChevronDown, Star, Heart, ShoppingCart, Shirt } from "lucide-react";
import Navbar from "@/components/bars/NavBar";
import CategoryCard from "@/components/ProductsPage/CategoryCard";
import ProductCard from "@/components/ProductsPage/ProductCard";
import SearchBar from "@/components/ProductsPage/SearchBar";
import Footer from "@/components/Footer";

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
  },
  {
    id: "4",
    name: "Balón de Fútbol Profesional FIFA Approved",
    imageUrl: "/products/balon.png",
    image: "/products/balon.png",
    date: '2024-06-02',
    price: 85000,
    originalPrice: 85000,
    stock: 45,
    isActive: true,
    rating: 4.6,
    reviews: 67,
    category: "Deporte",
    discount: 0,
    isNew: true,
    isFeatured: false,
  },
  {
    id: "5",
    name: "Cuaderno Universitario Espiral A4",
    imageUrl: "/products/cuaderno.png",
    image: "/products/cuaderno.png",
    date: '2024-06-02',
    price: 8500,
    originalPrice: 10000,
    stock: 200,
    isActive: true,
    rating: 4.3,
    reviews: 156,
    category: "Papelería",
    discount: 15,
    isNew: false,
    isFeatured: false,
  },
  {
    id: "6",
    name: "Vestido Casual de Verano para Mujer",
    imageUrl: "/products/vestido.png",
    image: "/products/vestido.png",
    date: '2024-06-02',
    price: 75000,
    originalPrice: 95000,
    stock: 23,
    isActive: true,
    rating: 4.4,
    reviews: 98,
    category: "Ropa de mujer",
    discount: 21,
    isNew: false,
    isFeatured: true,
  }
];

const categories = [
  {
    id: "1",
    name: "Deporte",
    imageUrl: "/categories/deporte.jpg",
    productCount: 45,
  },
  {
    id: "2",
    name: "Juguetes",
    imageUrl: "/categories/juguetes.jpg",
    productCount: 128,
  },
  {
    id: "3",
    name: "Ropa de hombre",
    imageUrl: "/categories/ropaHombre.jpg",
    productCount: 234,
  },
  {
    id: "4",
    name: "Ropa de mujer",
    imageUrl: "/categories/ropaMujer.webp",
    productCount: 189,
  },
  {
    id: "5",
    name: "Papelería",
    imageUrl: "/categories/papeleria.webp",
    productCount: 67,
  },
  {
    id: "6",
    name: "Joyería",
    imageUrl: "/categories/joyeria.jpg",
    productCount: 89,
  }
];

export default function ProductsPage() {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtros y ordenamiento
  useEffect(() => {
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

    setFilteredProducts(result);
  }, [selectedCategory, sortBy, priceRange, searchTerm]);

  const formatPrice = (price: string | number | bigint) => {
    const numericPrice = typeof price === "string" ? Number(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numericPrice);
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

        {/* Sección de Anuncios/Banners */}
        {/* <section className="my-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">¡Ofertas Especiales!</h3>
                <p className="text-lg mb-6">Hasta 50% de descuento en productos seleccionados</p>
                <button className="bg-white text-purple-600 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors duration-200">
                  Ver Ofertas
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl font-bold mb-2">Envío Gratis</h4>
                <p className="text-sm mb-4">En compras mayores a $100.000</p>
                <button className="text-green-100 hover:text-white transition-colors duration-200">
                  Más info →
                </button>
              </div>
            </div>
          </div>
        </section> */}

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
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Productos */}
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

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Grid de productos */}
          {!loading && (
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                : 'grid-cols-1'
              }`}>
              {filteredProducts.map((product) => (
                <div key={product.id} className="group">
                  <ProductCard product={product} viewMode={viewMode} />
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {!loading && filteredProducts.length === 0 && (
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
          )}
        </section>

        {/* Call to Action */}
        {/* <section className="mb-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            ¿No encontraste lo que buscabas?
          </h3>
          <p className="text-lg mb-8 text-blue-100">
            Regístrate para recibir notificaciones de nuevos productos y ofertas exclusivas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors duration-200">
              Registrarse
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-blue-600 transition-all duration-200">
              Contactar Soporte
            </button>
          </div>
        </section> */}
      </div>
      <div className="mb-18 lg:mb-0">
        <Footer />
      </div>
    </>
  );
}