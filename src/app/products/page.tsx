'use client'
import Navbar from "@/components/bars/NavBar"
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar"

const products = [
  {
    id: "1",
    name: "Camiseta de manga corta de cuello redondo para hombre",
    imageUrl: "/products/camiseta.png",
    image: "/products/camiseta.png",
    date: '2024-06-02',
    price: 40000,
    stock: 1000,
    isActive: true,
  },
  {
    id: "2",
    name: "Casco Edge Integral Shanghai Quartz Dot Y Ece 2206",
    imageUrl: "/products/casco.png",
    image: "/products/casco.png",
    date: '2024-06-02',
    price: 327000,
    stock: 0,
    isActive: false,
  },
  {
    id: "3",
    name: "Anillos Pareja Plata 925 Mujer Hombre Elegantes Compromiso",
    imageUrl: "/products/anillos.png",
    image: "/products/anillos.png",
    date: '2024-06-02',
    price: 26400,
    stock: 57,
    isActive: true,
  },
]

const categories = [
  {
    id: "1",
    name: "Deporte",
    imageUrl: "/categories/deporte.jpg",
  },
  
  {
    id: "2",
    name: "Juguetes",
    imageUrl: "/categories/juguetes.jpg",
  },
  
  {
    id: "3",
    name: "Ropa de hombre",
    imageUrl: "/categories/ropaHombre.jpg",
  },
  
  {
    id: "4",
    name: "Ropa de mujer",
    imageUrl: "/categories/ropaMujer.webp",
  },
  
  {
    id: "5",
    name: "papelería",
    imageUrl: "/categories/papeleria.webp",
  }
]

export default function productsPage() {
    return (
        <main>
            <Navbar />
            <div className="flex justify-center my-6">
            <SearchBar />
            </div>
            <section className="mb-20"> // categoria para los carruseles de anuncios

            </section>
            <section className="mb-20"> 
              <h2 className="ml-20 font-bold text-2xl">Categorias</h2>
              <div className="mt-5 grid grid-cols-5 gap-x-2 gap-y-4 justify-items-center">
                  {categories.map((category) => (
                    <CategoryCard key={category.id} category={category}/>
                  ))}
              </div>
            </section>
            <section className="mb-20">
                <h2 className="ml-20 font-bold text-2xl">Productos</h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product}/>
                    ))}
                </div>
            </section>
        </main>
    );
}